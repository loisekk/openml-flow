# 🧠 PROJECT MEMORY: Open-MLPipe Ultimate Studio

## 1. PROJECT OVERVIEW
**Name:** Open-MLPipe Ultimate Studio
**Purpose:** A production-grade, local-first visual Machine Learning workflow platform. Users visually build ML pipelines (like n8n), inspect data, generate Python code, and execute it locally.
**Target:** Open-source Beta (v1.0.0). Distributed via Docker.

## 2. TECH STACK
*   **Frontend:** React 19, TypeScript, Vite, React Flow, Zustand, Framer Motion, Monaco Editor, Lucide Icons, Recharts.
*   **Backend:** Python, FastAPI, Uvicorn, SQLite (`sqlite3`), `openai` python SDK.
*   **Deployment:** Docker Compose, Nginx (Reverse Proxy).

## 3. ARCHITECTURE & ROUTING
*   **Local Dev:** Vite dev server (port 5174) proxies `/api` requests to FastAPI (port 3001).
*   **Docker Prod:** Nginx serves the React build (port 8080) and proxies `/api` to the FastAPI container.
*   **CRITICAL:** All frontend API calls MUST use relative paths (`/api/...`). NEVER hardcode `http://localhost:3001` in frontend code.
*   **Execution Engine:** FastAPI uses `asyncio.to_thread` and `subprocess.Popen` with `sys.executable` to run Python scripts safely, streaming `stdout`/`stderr` back via Server-Sent Events (SSE). Nginx has `proxy_buffering off` for SSE to work.

## 4. DESIGN SYSTEM (STRICT)
*   **Theme:** Deep Premium Navy. NO pure black (`#000000`) or generic gray backgrounds.
*   **Colors (CSS Vars):**
    *   `--bg-primary: #050B18` (App Background)
    *   `--bg-panel: #0A1426` (Panels/Nodes)
    *   `--border: #18253A`
    *   `--text-primary: #F4F7FB`
    *   `--accent-orange: #FF7A00` (Primary Action / Execute)
    *   `--accent-purple: #8B5CF6` (AI Assistant / Code)
    *   `--accent-green: #22C55E` (Success)
    *   `--accent-red: #EF4444` (Error)
*   **Nodes:** Category-specific accent colors (Data=Blue, Models=Orange, EDA=Cyan, etc.), but node bodies remain deep navy. Status states override borders (Running=Orange glow, Success=Green, Error=Red).

## 5. STATE MANAGEMENT (Zustand)
*   `workflowStore.ts`: Manages nodes, edges, execution state, panel UI (resizing/collapsing), and custom code.
*   `dashboardStore.ts`: Mock workflow list for the dashboard.
*   `authStore.ts`: JWT token management.
*   `settingsStore.ts`: BYOK AI provider management.

## 6. KEY FEATURES & FILE LOCATIONS
*   **Node Studio:** Double-clicking a node on the canvas opens a floating `NodeStudio.tsx` window containing Parameters, Code, Environment, and AI tabs.
*   **Node Registry:** `nodeRegistry.ts` drives all UI, code generation, and dependency tracking. To add a new ML model, add an object here.
*   **Code Generator:** `useCodeGenerator.ts` and `codeGeneratorUtils.ts` convert visual nodes into Python scripts. Users can edit this code in Monaco.
*   **Package Manager:** FastAPI endpoints (`/api/environment/install`) use `sys.executable -m pip install` to install missing ML libraries (like `xgboost`) directly from the UI.
*   **BYOK AI Gateway:** Users provide their own OpenAI/Groq/Ollama API keys in Settings. Keys are stored in SQLite and never exposed to the frontend.

## 7. DEVELOPMENT RULES (DO NOT DO)
*   **DO NOT** use `asyncio.create_subprocess_exec` directly on Windows; it crashes. Always use `asyncio.to_thread` + `subprocess.Popen` with `sys.executable`.
*   **DO NOT** use default React Flow white/gray controls. Always theme them with the deep navy CSS overrides.
*   **DO NOT** hardcode API keys. Always use the BYOK provider architecture.
*   **DO NOT** break the `vite.config.ts` proxy setup.
*   **DO NOT** remove the `React.memo` wrapper around `WorkflowNode.tsx` (required for 60fps canvas performance).

## 8. ROADMAP (Post-Beta)
*   v1.1: True topological node-by-node execution (passing DataFrames between Python subprocess calls).
*   v1.2: Integrated WebSocket terminal.
*   v1.3: Live `psutil` CPU/RAM telemetry.
*   v1.4: EDA Charts (histograms/correlation) in Node Studio Data Profile.

## v1.1.1 ARCHITECTURE FACTS
- stdout protocol markers: `__MLPIPE_NODE__` (beacon), `__MLPIPE_DATA__`, `__MLPIPE_METRICS__`, `__MLPIPE_CHART__` — all intercepted in useExecutionEngine.ts; never printed raw
- Codegen single source of truth: utils/codeGeneratorUtils.ts. hooks/useCodeGenerator.ts is a thin reactive wrapper. NEVER duplicate node templates elsewhere
- Graph logic lives in utils/graphUtils.ts (topologicalSort, getAncestors, getDescendants, getExecutionChain) — pure, no React
- Charts = pure JSON protocol → Recharts (zero Python deps). Renderers in canvas/components/charts/. New chart type = Python template + renderer component
- CRITICAL: Zustand selectors must NEVER return fresh objects/arrays (`?? []` inside a selector crashes React 18 — the black-screen bug of v1.0.0)
- Generated scripts start with a TARGET_COLUMN / TASK_TYPE config header; split
  nodes validate the target column at runtime

## v1.1.2 FACTS
- ALL frontend fetches use relative `/api` paths. ZERO `localhost:3001` hardcoding
  allowed — release checklist greps for it.
- authStore login/register return `string | null` (null = success, string =
  user-readable error). Consumers must use `if (err === null)`, never truthiness.
- Authed-fetch pattern (copy for all future authed calls): `res.ok` check →
  Array.isArray/type guard on body → handleAuthFailure (401/403 → logout).

## AI GATEWAY FACTS
- OpenRouter serves /models PUBLICLY (no auth) — models.list() is NOT a
  credential check there. Provider connection tests MUST probe with a
  1-token chat completion (test_provider_connection in ai_gateway.py).
- GET /openapi.json is the definitive stale-code detector: it shows the
  running app's actual route table.
- Renamed Docker containers keep their port bindings — stop/remove old
  containers before binding host processes to the same ports.
