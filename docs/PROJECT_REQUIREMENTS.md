# Project Requirements

## Functional Requirements

1. **Real‑time Telemetry Ingestion**
   - Collect logs/events from IAM, PAM, EDR, Database Audit, VPN, Network sensors via Kafka/REST.
   - Normalize to a unified `SecurityEvent` schema.
2. **Agent‑Based Correlation**
   - Modular Python agents (Identity, Endpoint, Database, Network, ThreatIntel, Policy, Coordinator, ExplainableAI).
   - Each agent implements `process(event: dict) -> dict` and registers via plugin registry.
3. **Risk Scoring & Anomaly Detection**
   - Isolation Forest & Autoencoder for anomaly detection.
   - XGBoost model for insider‑threat scoring.
4. **Explainable Incident Generation**
   - Build causal graphs (NetworkX) and generate Mermaid sequence diagrams.
   - Produce markdown incident reports with recommendations.
5. **SOC Dashboard**
   - Real‑time risk charts (Recharts), incident timelines (React Flow), and detailed view.
   - Role‑based access (SOC analyst, admin).
6. **APIs**
   - FastAPI endpoints for telemetry ingestion, incident query, agent management, and risk engine.
   - OpenAPI spec generated automatically.

## Non‑Functional Requirements

- **Scalability**: Horizontal scaling via Kubernetes; stateless agents, Kafka partitioning.
- **Latency**: End‑to‑end detection < 5 seconds for high‑priority events.
- **Security & Compliance**: Data encryption at rest (AES‑256) and in‑flight (TLS 1.3), audit logging, GDPR & PCI‑DSS compliance.
- **Observability**: Structured logging (JSON), OpenTelemetry tracing, Prometheus metrics, Grafana dashboards.
- **Reliability**: Fault‑tolerant agents, retry queues, dead‑letter topics.
- **Maintainability**: Clean architecture, SOLID principles, comprehensive unit/integration tests, CI/CD pipeline.
- **Extensibility**: Plugin architecture to add new agents or telemetry sources without code changes.
