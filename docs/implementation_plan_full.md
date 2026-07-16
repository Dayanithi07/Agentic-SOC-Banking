# Project Scaffolding & Testing Plan

## Goal Description
Build the complete **Agentic SOC Copilot** project as described in the architecture and implementation prompts, including:
- Backend (FastAPI) with telemetry ingestion, AI‑agent orchestration, and health endpoints.
- Frontend (React + TypeScript via Vite) dashboard.
- Docker‑Compose for local development (backend, frontend, Redis, PostgreSQL).
- CI/CD pipeline (GitHub Actions) with linting, unit tests, and Docker image builds.
- Comprehensive documentation inside `docs/`.
- Minimal test suites for both backend and frontend.

## User Review Required
- **Real‑time data source details**: URLs, authentication method, and any required SDKs for IAM, PAM, EDR, CloudTrail, etc.
- **AI model endpoint**: e.g., OpenAI, Anthropic, or a self‑hosted LLM; provide the base URL and API key name.
- **Deployment target**: Docker‑Compose locally, Kubernetes cluster, or cloud service (Render, Vercel, etc.).
- **Database choice**: PostgreSQL (default) or another store.
- **Preferred testing framework**: `pytest` for Python, `vitest` for TS, or alternatives.

> [!IMPORTANT] The code will contain placeholder connection logic; you must later replace the placeholders with real credentials and endpoints.

## Open Questions
1. Do you want **Redis** as a message broker for async tasks, or another solution?
2. Should the **frontend** be served via the backend (single container) or separately with its own Nginx?
3. Any specific linter/formatter preferences (e.g., `ruff` + `black` for Python, `eslint` + `prettier` for TS)?
4. Do you need **OAuth2** integration for the API, or will simple API‑key auth suffice?

## Proposed Changes
### Backend (`backend/`)
- `requirements.txt` (already added).
- `app/main.py` (already added).
- **New files**:
  - `app/api/health.py`
  - `app/api/agents.py` (enhance with routes for telemetry, status, WebSocket).
  - `app/models/telemetry.py` (Pydantic schemas).
  - `app/models/analysis.py` (AI response schemas).
  - `app/services/connector_base.py` (abstract connector class).
  - `app/services/iam_connector.py`, `pam_connector.py`, `edr_connector.py`, `cloudtrail_connector.py` (stub async fetch functions).
  - `Dockerfile` (already added).
- Test directory `tests/` with sample `test_main.py` and `test_agents.py`.

### Frontend (`frontend/`)
- Initialize Vite React‑TS project.
- Core files: `package.json`, `vite.config.ts`, `tsconfig.json`.
- `src/main.tsx`, `src/App.tsx` (layout with navbar, placeholder panels).
- Component folder `src/components/` with:
  - `AlertList.tsx`
  - `InvestigationPanel.tsx`
  - `LiveFeed.tsx`
- `src/api/client.ts` (Axios wrapper for backend API).
- **Dockerfile** for frontend (multi‑stage build → nginx).
- Test folder `src/tests/` with a basic Vitest test for `AlertList`.

### DevOps
- `docker-compose.yml` (services: backend, frontend, redis, postgres).
- `.github/workflows/ci.yml` (lint, test, build images).
- `.gitignore` (Python, Node, IDE files).

### Documentation (`docs/`)
- `README.md` (already present – will be expanded with quick‑start).
- `PROJECT_REQUIREMENTS.md`
- `SYSTEM_ARCHITECTURE.md` (mermaid diagram placeholder).
- `AGENT_SPECIFICATIONS.md`
- `DATABASE_SCHEMA.md`
- `BACKEND_SPEC.md`
- `FRONTEND_SPEC.md`
- `API_SPEC.md`
- `WORKFLOW.md`
- `TECH_STACK.md`

### Environment
- `.env.example` with placeholders for:
  - `FRONTEND_ORIGIN`
  - `REDIS_URL`
  - `POSTGRES_DSN`
  - `AI_ENDPOINT`
  - `AI_API_KEY`
  - Telemetry source URLs and auth tokens.

### Scripts (`scripts/`)
- `run_local.ps1` – starts Docker‑Compose.
- `seed_mock_data.py` – optional script to push sample telemetry for dev.

## Verification Plan
### Automated Tests
- **Backend**: `pytest` – test FastAPI startup, health endpoint, telemetry POST validation, model serialization.
- **Frontend**: `vitest` – shallow render of components, verify API client functions.
- **CI**: GitHub Actions will run the above on each push.
### Manual Checks
- `docker compose up` – ensure all services start, the frontend loads, and the backend health endpoint returns `200`.
- Use a REST client (e.g., `curl`) to POST a sample telemetry JSON and verify a response with a risk score.
- Open the UI in a browser, confirm live updates appear via WebSocket (stub data).

---
Please review the plan and confirm or provide adjustments. Once approved, I will generate all the listed files and run the initial tests.
