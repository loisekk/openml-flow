# 🧬 OpenML Flow

OpenML Flow is a production-grade, local-first visual Machine Learning workflow platform. Build complete ML pipelines visually, inspect data in real-time, generate Python code, and execute it locally.

## 🚀 Quick Start (Docker)

Ensure you have Docker and Docker Compose installed. Save the following as `docker-compose.yml` on your machine:

```yaml
version: '3.8'

services:
  backend:
    image: loisekk/openml-flow-backend:latest
    container_name: openml-flow-backend
    ports:
      - "3001:3001"
    volumes:
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

Run it with:
```bash
docker-compose up -d
```

Access the application at: `http://localhost:8080`

## 🔄 Updating to a New Version

When a new version of OpenML Flow is released, update your local instance without losing your workflows or datasets:

```bash
docker-compose pull
docker-compose up -d
```

## 🛠️ Local Development Setup

If you want to run the project outside of Docker for development:

**1. Start the Backend:**
```bash
cd server
pip install -r requirements.txt
python main.py
```

**2. Start the Frontend:**
```bash
cd client
npm install
npm run dev
```
Access the dev server at `http://localhost:5174`.
