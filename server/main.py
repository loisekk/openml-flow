# main.py
import os
import json
import uuid
import asyncio
import tempfile
import hashlib
import hmac
import secrets
import subprocess
import sys
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import sqlite3
from jose import JWTError, jwt # type: ignore

# Make sure to run: pip install openai
from openai import OpenAI 

# CRITICAL WINDOWS FIX: Force ProactorEventLoop so asyncio supports subprocesses on Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Config ---
SECRET_KEY = "super_secret_jwt_key_123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# --- Password Hashing ---
class PasswordHasher:
    def __init__(self, iterations: int = 100_000):
        self.iterations = iterations

    def hash(self, password: str) -> str:
        salt = secrets.token_hex(16)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), self.iterations)
        return f"pbkdf2_sha256${self.iterations}${salt}${dk.hex()}"

    def verify(self, password: str, hashed: str) -> bool:
        try:
            algo, iterations, salt, stored_hash = hashed.split("$")
            if algo != "pbkdf2_sha256": return False
            dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations))
            return hmac.compare_digest(dk.hex(), stored_hash)
        except (ValueError, TypeError): return False

pwd_context = PasswordHasher()

# --- Database Setup ---
DB_NAME = "openmlpipe.db"
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS workflows (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, graph_data TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS ai_providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        api_key TEXT NOT NULL,
        model TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    try: yield conn
    finally: conn.close()

# --- Models ---
class UserAuth(BaseModel): username: str; password: str
class CodeRun(BaseModel): code: str
class WorkflowSave(BaseModel): id: Optional[int] = None; name: str; graphData: dict
class AIRequest(BaseModel): prompt: str; context: str

class AIProvider(BaseModel):
    id: Optional[int] = None
    name: str
    baseUrl: str
    apiKey: str
    model: str
    isActive: bool = False

# --- Auth Helpers ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(request: Request, db = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "): raise HTTPException(status_code=401, detail="No token provided")
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None: raise HTTPException(status_code=403, detail="Invalid token")
        user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if user is None: raise HTTPException(status_code=403, detail="User not found")
        return user
    except JWTError: raise HTTPException(status_code=403, detail="Invalid token")

# --- Auth Routes ---
@app.post("/api/auth/register")
def register(user: UserAuth, db = Depends(get_db)):
    existing = db.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
    if existing: raise HTTPException(status_code=409, detail="Username already exists")
    db.execute("INSERT INTO users (username, password) VALUES (?, ?)", (user.username, pwd_context.hash(user.password)))
    db.commit()
    return {"message": "User registered successfully!"}

@app.post("/api/auth/login")
def login(user: UserAuth, db = Depends(get_db)):
    db_user = db.execute("SELECT * FROM users WHERE username = ?", (user.username,)).fetchone()
    if not db_user or not pwd_context.verify(user.password, db_user["password"]): raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": create_access_token(data={"sub": db_user["username"]}), "username": db_user["username"]}

# --- Dataset Routes ---
@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    filename = os.path.basename(file.filename or "upload.bin")
    file_path = os.path.join(UPLOADS_DIR, filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"filename": filename, "path": file_path}

@app.get("/api/datasets")
def list_datasets():
    datasets = []
    if os.path.exists(UPLOADS_DIR):
        for filename in os.listdir(UPLOADS_DIR):
            filepath = os.path.join(UPLOADS_DIR, filename)
            if os.path.isfile(filepath):
                size = os.path.getsize(filepath)
                datasets.append({
                    "name": filename,
                    "size": f"{size / 1024:.2f} KB",
                    "path": filepath
                })
    return datasets

# --- Workflow Routes ---
@app.get("/api/workflows")
def list_workflows(user = Depends(get_current_user), db = Depends(get_db)):
    workflows = db.execute("SELECT id, name, created_at, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC", (user["id"],)).fetchall()
    return [{"id": wf["id"], "name": wf["name"], "created_at": wf["created_at"], "updated_at": wf["updated_at"]} for wf in workflows]

@app.post("/api/workflows/save")
def save_workflow(wf: WorkflowSave, user = Depends(get_current_user), db = Depends(get_db)):
    if wf.id:
        db.execute("UPDATE workflows SET name = ?, graph_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", (wf.name, json.dumps(wf.graphData), wf.id, user["id"]))
        db.commit()
        return {"id": wf.id, "message": "Workflow updated"}
    else:
        cursor = db.execute("INSERT INTO workflows (user_id, name, graph_data) VALUES (?, ?, ?)", (user["id"], wf.name, json.dumps(wf.graphData)))
        db.commit()
        return {"id": cursor.lastrowid, "message": "Workflow saved"}

@app.get("/api/workflows/load/{wf_id}")
def load_workflow(wf_id: int, user = Depends(get_current_user), db = Depends(get_db)):
    wf = db.execute("SELECT * FROM workflows WHERE id = ? AND user_id = ?", (wf_id, user["id"])).fetchone()
    if not wf: raise HTTPException(status_code=404, detail="Workflow not found")
    return {"id": wf["id"], "name": wf["name"], "graphData": json.loads(wf["graph_data"])}

# --- Execution Engine ---
run_code_cache = {}

@app.post("/api/run/start")
def start_run(code: CodeRun):
    run_id = str(uuid.uuid4())[:8]
    run_code_cache[run_id] = code.code
    return {"runId": run_id}

@app.get("/api/run/stream/{run_id}")
async def stream_run(run_id: str, request: Request):
    code = run_code_cache.get(run_id)
    if not code: raise HTTPException(status_code=404, detail="Run ID not found or expired.")

    async def event_generator():
        with tempfile.NamedTemporaryFile(delete=False, suffix=".py", mode="w") as f:
            f.write(code)
            temp_file_path = f.name

        try:
            def run_process():
                return subprocess.Popen(
                    [sys.executable, temp_file_path], # Use sys.executable for consistency
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1
                )
            
            process = await asyncio.to_thread(run_process)
            
            if process.stdout is None or process.stderr is None:
                raise RuntimeError("Failed to capture process output streams.")

            while True:
                line = await asyncio.to_thread(process.stdout.readline)
                if not line:
                    break
                output = line.strip()
                if output:
                    yield f"data: {json.dumps(output)}\n\n"
            
            return_code = await asyncio.to_thread(process.wait)
            
            stderr_data = await asyncio.to_thread(process.stderr.read)
            if stderr_data:
                err_output = stderr_data.strip()
                if err_output:
                    yield f"data: {json.dumps(f'[STDERR] {err_output}')}\n\n"

            yield f"event: done\ndata: {json.dumps(f'Process finished with exit code {return_code}.')}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps(f'[ERROR] {str(e)}')}\n\n"
            yield f"event: done\ndata: {json.dumps('Execution failed.')}\n\n"
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            if run_id in run_code_cache:
                del run_code_cache[run_id]

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- AI Provider Management (BYOK) ---
@app.get("/api/ai/providers")
def get_providers(user = Depends(get_current_user), db = Depends(get_db)):
    providers = db.execute("SELECT id, name, base_url, model, is_active FROM ai_providers WHERE user_id = ?", (user["id"],)).fetchall()
    return [{"id": p["id"], "name": p["name"], "baseUrl": p["base_url"], "model": p["model"], "isActive": bool(p["is_active"])} for p in providers]

@app.post("/api/ai/providers")
def add_provider(provider: AIProvider, user = Depends(get_current_user), db = Depends(get_db)):
    if provider.isActive:
        db.execute("UPDATE ai_providers SET is_active = 0 WHERE user_id = ?", (user["id"],))
    
    cursor = db.execute(
        "INSERT INTO ai_providers (user_id, name, base_url, api_key, model, is_active) VALUES (?, ?, ?, ?, ?, ?)",
        (user["id"], provider.name, provider.baseUrl, provider.apiKey, provider.model, provider.isActive)
    )
    db.commit()
    return {"id": cursor.lastrowid, "message": "Provider added"}

@app.post("/api/ai/providers/{provider_id}/activate")
def activate_provider(provider_id: int, user = Depends(get_current_user), db = Depends(get_db)):
    db.execute("UPDATE ai_providers SET is_active = 0 WHERE user_id = ?", (user["id"],))
    db.execute("UPDATE ai_providers SET is_active = 1 WHERE id = ? AND user_id = ?", (provider_id, user["id"]))
    db.commit()
    return {"message": "Provider activated"}

@app.delete("/api/ai/providers/{provider_id}")
def delete_provider(provider_id: int, user = Depends(get_current_user), db = Depends(get_db)):
    db.execute("DELETE FROM ai_providers WHERE id = ? AND user_id = ?", (provider_id, user["id"]))
    db.commit()
    return {"message": "Provider deleted"}

# --- Upgraded AI Gateway ---
@app.post("/api/ai/chat")
def ai_chat(req: AIRequest, user = Depends(get_current_user), db = Depends(get_db)):
    provider = db.execute("SELECT * FROM ai_providers WHERE user_id = ? AND is_active = 1", (user["id"],)).fetchone()
    
    if not provider:
        return {"response": "No active AI provider configured. Please go to Settings → AI Providers to add your API key or local LLM."}
    
    try:
        client = OpenAI(
            api_key=provider["api_key"],
            base_url=provider["base_url"]
        )
        
        system_prompt = (
            "You are an expert ML Assistant integrated into Open-MLPipe, a visual ML pipeline builder. "
            "The user has built a workflow. Answer their question concisely based on the workflow context provided. "
            "Use markdown for code blocks if necessary.\n\n"
            f"Workflow Context:\n{req.context}"
        )
        
        response = client.chat.completions.create(
            model=provider["model"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.prompt}
            ],
            max_tokens=500
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"response": f"AI Gateway Error: {str(e)}"}

# --- Python Environment Manager ---
@app.get("/api/environment/info")
def get_env_info():
    return {
        "python_version": sys.version.split(" ")[0],
        "executable": sys.executable
    }

@app.get("/api/environment/packages")
def get_packages():
    try:
        # Uses pip's JSON output for reliable parsing
        result = subprocess.run([sys.executable, "-m", "pip", "list", "--format=json"], capture_output=True, text=True)
        packages = json.loads(result.stdout)
        return {"packages": packages}
    except Exception as e:
        return {"error": str(e)}

class PackageInstall(BaseModel):
    package: str

@app.post("/api/environment/install")
def install_package(req: PackageInstall):
    try:
        # Safely install using the exact python executable running the server
        result = subprocess.run([sys.executable, "-m", "pip", "install", req.package], capture_output=True, text=True)
        if result.returncode == 0:
            return {"success": True, "output": result.stdout}
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)