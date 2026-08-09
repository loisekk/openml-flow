<div align="center">

# 🧬 OpenML Flow

### The Local-First Visual Machine Learning IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

Build, train, evaluate, and deploy complete machine learning pipelines visually. OpenML Flow combines the workflow automation of n8n with the deep technical capabilities of a dedicated ML IDE like VS Code or JupyterLab.

[Getting Started](#-getting-started) • [Features](#-key-features) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

---

## 📖 Overview

OpenML Flow is not just another node-based automation tool; it is a dedicated engineering environment for Machine Learning. It bridges the gap between visual pipeline building and raw, code-level control. 

Instead of locking users into a rigid UI, OpenML Flow provides a visual graph that **generates clean, executable Python code** in real-time. Users can inspect data, install packages, execute nodes individually, and monitor local compute resources—all within a premium, dark-themed interface.

### Why OpenML Flow?
- **Local-First:** All computation, data processing, and model training happen on *your* machine. No cloud GPU bills, no data leakage.
- **Code Transparency:** The visual graph is the source of truth, but it generates clean `pandas` and `scikit-learn` Python code that you can edit directly in the built-in Monaco editor.
- **BYOK AI Assistant:** Integrated AI copilot that understands your workflow context. Bring your own API keys (OpenAI, Groq, Ollama)—no middleman fees.
- **True IDE Experience:** Dockable panels, floating Node Studio windows, real-time data profiling, and an integrated Python package manager.

---

## ✨ Key Features

### 🎨 Visual Pipeline Builder
- **Infinite React Flow Canvas:** Build complex ML workflows with an n8n-style infinite canvas.
- **Dynamic Node Registry:** A categorized library of ML nodes (Data Loading, EDA, Cleaning, Feature Engineering, Modeling, Evaluation, Deployment).
- **Execution States:** Visual feedback for every node (Idle, Running, Success, Error) with animated edges.

### 💻 Integrated Development Environment
- **Node Studio:** Double-click any node to open a dedicated IDE window for that specific operation. Edit parameters, view input/output data, and modify generated code.
- **Monaco Code Editor:** Full VS Code-style editing with syntax highlighting. Code updates dynamically as you change visual nodes.
- **Real-time Python Execution:** Execute the entire workflow or run individual nodes locally via FastAPI subprocess streaming.

### 📊 Data & Telemetry
- **Live Data Previews:** Inspect DataFrame schemas and row data directly in the Node Studio after a node executes.
- **Local Runtime Monitor:** CPU and RAM usage displayed directly in the workspace dashboard.

### 🧠 AI Copilot (BYOK)
- **Context-Aware Chat:** The AI assistant knows your workflow graph, node parameters, and execution logs.
- **Bring Your Own Key:** Supports any OpenAI-compatible API (OpenAI, Groq, OpenRouter, local Ollama/LM Studio). Keys are stored securely locally.

### 📦 Environment Management
- **Integrated Package Manager:** Install any Python library (e.g., `xgboost`, `tensorflow`) directly from the UI.
- **Dependency Tracking:** Nodes declare their required packages. The UI alerts you if a dependency is missing before execution.

---

## 🏗 Architecture

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

## 🚀 Getting Started

OpenML Flow is designed to be run locally via Docker. This ensures a consistent environment without polluting your system Python.

### Prerequisites
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start (Docker)

1. Save the following as `docker-compose.yml` on your machine:

```yaml
version: '3.8'

services:
  backend:
    image: loisekk/openml-flow-backend:latest
    container_name: openml-flow-backend
    ports:
      - "3001:3001"
    volumes:
      # Persist uploaded datasets and SQLite DB
      - ./uploads:/app/uploads
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

2. Run the application:
```bash
docker-compose up -d
```

3. Access the platform at: **http://localhost:8080**

> *Note: The first launch will create the `uploads` folder and `openmlpipe.db` database file in the same directory as your `docker-compose.yml` to persist your workflows and datasets.*

---

## 🛠️ Local Development Setup

If you want to contribute or run the project outside Docker:

### 1. Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Backend runs on `http://localhost:3001`*

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5174` (configured via Vite proxy to route `/api` to backend)*

---

## 🔄 Updating

When a new version of OpenML Flow is released, you can update your local instance without losing your data:

```bash
docker-compose pull
docker-compose up -d
```

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
