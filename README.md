<div align="center">

# 🧬 OpenML Flow

### The Local-First Visual Machine Learning IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

Build, train, evaluate, and deploy complete machine learning pipelines visually. OpenML Flow combines the workflow automation of n8n with the deep technical capabilities of a dedicated ML IDE like VS Code or JupyterLab.

</div>

---

## 📖 Overview

OpenML Flow is not just another node-based automation tool; it is a dedicated engineering environment for Machine Learning. It bridges the gap between visual pipeline building and raw, code-level control. 

Instead of locking users into a rigid UI, OpenML Flow provides a visual graph that **generates clean, executable Python code** in real-time. Users can inspect data, install packages, execute nodes individually, and monitor local compute resources—all within a premium, dark-themed interface.

### Why OpenML Flow?
- **Local-First:** All computation, data processing, and model training happen on *your* machine. No cloud GPU bills, no data leakage.
- **Code Transparency:** The visual graph is the source of truth, but it generates clean `pandas` and `scikit-learn` Python code that you can edit directly in the built-in Monaco editor.
- **BYOK AI Assistant:** Integrated AI copilot that understands your workflow context. Bring your own API keys (OpenAI, Groq, Ollama)—no middleman fees.

---

## 🚀 Quick Start (Docker)

Run the entire platform locally in 30 seconds. No need to clone the source code.

1. Create a new, empty folder on your machine and open a terminal in it.
2. Save the following code as `docker-compose.yml`:

```yaml
services:
  backend:
    image: loisekk/openml-flow-backend:latest
    container_name: openml-flow-backend
    ports:
      - "3001:3001"
    volumes:
      # This saves your uploaded datasets locally
      - ./uploads:/app/uploads
      # This saves your user accounts and workflows locally
      - ./openmlpipe.db:/app/openmlpipe.db
    environment:
      - PYTHONUNBUFFERED=1

  frontend:
    image: loisekk/openml-flow-frontend:latest
    container_name: openml-flow-frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
```

> **⚠️ Important for Windows Users:** 
> Before running the command below, you must manually create an empty file named `openmlpipe.db` in the same folder. If you don't, Docker Desktop will mount it as a directory instead of a file, which will crash the SQLite database. You can do this by running `echo. > openmlpipe.db` in your Command Prompt.

3. Run the application:
```bash
docker-compose up -d
```

4. Access the platform at: **http://localhost:8080**

---

## 🔄 Updating to a New Version

When a new version of OpenML Flow is released, update your local instance without losing your data:

```bash
docker-compose pull
docker-compose up -d
```

---

## 🏗️ Architecture

OpenML Flow uses a decoupled architecture with a React frontend communicating with a Python FastAPI backend.

```text
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                         │
│  (React 19, Vite, React Flow, Zustand, Monaco Editor)       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / Server-Sent Events (SSE)
┌──────────────────────────▼──────────────────────────────────┐
│                      FastAPI Backend                         │
│           (Python, SQLite, JWT Auth, OpenAI SDK)             │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────┐    ┌─────────────────────────────┐
│   Local Execution Engine │    │      Local AI Gateway       │
│ (asyncio/subprocess)     │    │ (OpenAI API / Local Ollama) │
└──────────────────────────┘    └─────────────────────────────┘
```

---

## 🛠️ Local Development Setup

If you want to contribute to the source code or run the project outside of Docker:

**1. Clone the repository:**
```bash
git clone https://github.com/loisekk/openml-flow.git
cd openml-flow
```

**2. Start the Backend:**
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Backend runs on `http://localhost:3001`*

**3. Start the Frontend:**
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5174` (configured via Vite proxy to route `/api` to backend)*

**4. Or run the full stack locally via Docker Compose:**
*(This uses the `docker-compose.yml` in the repository root, which builds from source)*
```bash
docker-compose up -d --build
```

---

## ✨ Key Features

- **Visual Pipeline Builder:** Infinite React Flow canvas with categorized ML nodes.
- **Node Studio:** Double-click any node to open a dedicated IDE window. Edit parameters, view input/output data, and modify generated code in Monaco Editor.
- **Local-First Execution:** All Python execution happens securely on your machine via FastAPI subprocess streaming.
- **BYOK AI Copilot:** Integrated AI assistant that understands your workflow. Supports OpenAI, Groq, and local Ollama.
- **Integrated Package Manager:** Install any Python library (e.g., `xgboost`) directly from the UI.
- **Persistent State:** SQLite database and local volume mapping ensure your workflows and datasets are never lost.

---

## 🗺️ Roadmap

OpenML Flow is in active development. Here is what's planned for future releases:

- **v1.1: Advanced Execution Engine:** True topological node-by-node execution (passing DataFrames between Python subprocess calls sequentially).
- **v1.2: Integrated Terminal:** A WebSocket-based terminal in the bottom panel for direct CLI access to the Python environment.
- **v1.3: EDA Charts:** Real-time rendering of histograms, scatter plots, and correlation heatmaps inside the Node Studio.
- **v1.4: Model Registry & MLflow Integration:** Track experiments and version models directly from the visual canvas.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add a new ML node, improve the UI, or fix a bug:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

Copyright © 2026 OpenML Flow

</div>
