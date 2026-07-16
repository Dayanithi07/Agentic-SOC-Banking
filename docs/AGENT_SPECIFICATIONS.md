# Agent Specifications

## 1. Identity Agent
- **Purpose**: Normalizes IAM and PAM logs into the unified `SecurityEvent` schema.
- **Input**: Raw JSON logs from IAM/PAM systems.
- **Output**: Normalized events with fields: `user_id`, `action`, `resource`, `timestamp`, `source`.
- **Key Logic**: Enriches with asset inventory data, validates against policy rules.

## 2. Endpoint Agent
- **Purpose**: Processes EDR alerts and host telemetry.
- **Input**: EDR event streams (e.g., Microsoft Defender, CrowdStrike).
- **Output**: Normalized events with fields: `endpoint_id`, `process_name`, `event_type`, `timestamp`.

## 3. Database Agent
- **Purpose**: Captures database audit logs.
- **Input**: PostgreSQL audit logs, Oracle audit trails.
- **Output**: Events containing `db_name`, `sql_statement`, `user`, `timestamp`.

## 4. Network Agent
- **Purpose**: Ingests NetFlow/Zeek network telemetry.
- **Input**: Network flow records, DNS logs.
- **Output**: Events with `src_ip`, `dst_ip`, `protocol`, `bytes`, `timestamp`.

## 5. Threat Intel Agent
- **Purpose**: Enriches events with external threat intelligence.
- **Input**: Indicators of Compromise (IoCs) from STIX/TAXII feeds.
- **Output**: Enriched events with `threat_score`, `intel_source`.

## 6. Policy Agent
- **Purpose**: Applies compliance and security policy checks.
- **Input**: Normalized events.
- **Output**: Events flagged with `policy_violation` details.

## 7. Coordinator Agent
- **Purpose**: Orchestrates incident creation, routes high‑risk events to the Risk Engine.
- **Input**: Flagged events from detection layer.
- **Output**: Incident records stored in PostgreSQL.

## 8. Risk Engine
- **Purpose**: Computes risk scores using Isolation Forest, Auto‑encoder, and XGBoost models.
- **Input**: Feature vectors derived from normalized events.
- **Output**: `risk_score`, `severity`.

## 9. Explainable AI Agent
- **Purpose**: Generates causal graphs and narrative explanations for incidents.
- **Input**: Incident context and related events.
- **Output**: Mermaid sequence diagram and markdown report.

Each agent follows the common Python interface:
```python
class BaseAgent:
    def process(self, event: dict) -> dict:
        """Process a single event and return enriched/filtered output."""
        raise NotImplementedError
```

---
*Generated on 2026‑07‑16*
