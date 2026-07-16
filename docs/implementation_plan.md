# Finish Agentic SOC Copilot Project

## Goal Description
The aim is to deliver a production‑ready Agentic SOC Copilot that ingests real‑time telemetry from IAM/EDR sources, processes it via FastAPI services, stores events, and visualizes alerts and metrics in a polished React UI. All components must be fully implemented, tested, containerized, and documented as per the architecture and implementation prompts.

## User Review Required
> [!IMPORTANT] **Potential breaking changes**
> - The backend `EventStore` service and connector implementations will introduce new Pydantic models that may affect existing API contracts.
> - Frontend UI components will replace placeholder stubs; ensure any custom styling aligns with the project's design system.
> - Docker images will be rebuilt; confirm you have sufficient disk space.

## Open Questions
- **Telemetry source details**: Which IAM/EDR APIs (e.g., Azure AD, CrowdStrike) and authentication mechanisms should the connectors use?
- **Data schema**: Are there any mandatory fields beyond `event_id`, `timestamp`, `source`, `type`, and `payload` for the telemetry events?
- **Frontend theming**: Preferred primary/secondary colors or brand guidelines for the UI?
- **Deployment environment**: Target Kubernetes cluster or local Docker only?

## Proposed Changes
---
### Backend Services
#### [MODIFY] [backend/app/models/telemetry.py](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/backend/app/models/telemetry.py)
- Add full Pydantic schemas for `TelemetryEvent`, `ConnectorConfig`, and response models.
#### [NEW] [backend/app/services/connector.py](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/backend/app/services/connector.py)
- Implement abstract `BaseConnector` and concrete `AzureADConnector`, `CrowdStrikeConnector` with async streaming.
#### [MODIFY] [backend/app/services/event_store.py](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/backend/app/services/event_store.py)
- Provide in‑memory store with optional Redis backend.
#### [MODIFY] [backend/app/api/agents.py](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/backend/app/api/agents.py)
- Wire up service layer: validate incoming event against `TelemetryEvent`, store via `EventStore`, trigger async connector processing.
#### [NEW] [backend/tests/test_telemetry.py](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/backend/tests/test_telemetry.py)
- Unit tests for model validation, service methods, and API endpoint.
---
### Frontend React UI
#### [NEW] [frontend/src/components/TelemetryStream.tsx](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/frontend/src/components/TelemetryStream.tsx)
- Real‑time WebSocket client showing incoming events in a table with filtering.
#### [MODIFY] [frontend/src/App.tsx](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/frontend/src/App.tsx)
- Add routing to `/telemetry` and include `TelemetryStream` component.
#### [NEW] [frontend/src/theme.ts](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/frontend/src/theme.ts)
- Define a dark‑mode friendly palette and global CSS variables.
#### [NEW] [frontend/tests/TelemetryStream.test.tsx](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/frontend/tests/TelemetryStream.test.tsx)
- Jest/React Testing Library test suite for the stream component.
---
### DevOps & CI
#### [MODIFY] [docker-compose.yml](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/docker-compose.yml)
- Add environment variables for connector credentials, expose WebSocket port.
#### [MODIFY] [.github/workflows/ci.yml](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/.github/workflows/ci.yml)
- Run backend and frontend tests, build Docker images, push to registry (optional).
---
### Documentation
#### [MODIFY] [docs/SYSTEM_ARCHITECTURE.md](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/docs/SYSTEM_ARCHITECTURE.md)
- Update diagram to include connector services and WebSocket flow.
#### [NEW] [docs/DEPLOYMENT_GUIDE.md](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/docs/DEPLOYMENT_GUIDE.md)
- Step‑by‑step instructions for local Docker compose and Kubernetes deployment.
#### [NEW] [docs/TELEMETRY_SCHEMA.md](file:///C:/Users/Acer/.gemini/antigravity-ide/brain/c674089f-cda3-43c9-8795-b5976c467155/docs/TELEMETRY_SCHEMA.md)
- Detailed field definitions for the telemetry events.
---
## Verification Plan
### Automated Tests
- `pytest` suite covering backend models, services, and API (`backend/tests/`).
- `npm test` (Jest) for frontend components.
- CI workflow runs both test suites and ensures Docker images build without errors.
### Manual Verification
- Spin up `docker-compose up` locally.
- Use Postman or curl to POST a sample telemetry event to `/api/agents/telemetry` and verify it appears in the React UI stream.
- Confirm connectors can fetch mock data (use static JSON fixtures) and store events.
- Review generated documentation for completeness.

**Please review the plan, answer the open questions, and approve to proceed with implementation.**
