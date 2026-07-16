# Running the Agentic SOC Copilot

## Quick Start (Demo — Frontend Only)

```bash
cd frontend
node node_modules/vite/bin/vite.js --host --port 5173
```
Open http://localhost:5173 — works fully with mock data.

---

## Full Stack (Frontend + AI Backend)

### 1. Set up environment
```bash
cp .env.example .env
# Add your GEMINI_API_KEY from https://aistudio.google.com
```

### 2. Install backend dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Start backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
API docs available at: http://localhost:8000/docs

### 4. Start frontend (separate terminal)
```bash
cd frontend
node node_modules/vite/bin/vite.js --host --port 5173
```

Open http://localhost:5173 — now powered by live Gemini AI responses.

---

## API Endpoints

| Method | Endpoint           | Description                     |
|--------|--------------------|---------------------------------|
| GET    | /api/events        | Get all security events         |
| GET    | /api/events/stats  | Dashboard statistics            |
| POST   | /api/run-cycle     | Trigger AI detection cycle      |
| POST   | /api/chat          | Chat with SOC Copilot (Gemini)  |
| GET    | /api/agents/status | All 6 agent statuses            |
| WS     | /ws/telemetry      | Live event stream               |
| GET    | /docs              | Interactive API docs            |
