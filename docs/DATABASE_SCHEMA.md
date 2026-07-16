# Database Schema

## Tables

### security_events
| Column | Type | Description |
|---|---|---|
| id | UUID PK | Unique event identifier |
| source | VARCHAR(50) | Telemetry source (IAM, EDR, DB, Network) |
| raw_payload | JSONB | Original event data |
| normalized_payload | JSONB | Unified `SecurityEvent` schema |
| received_at | TIMESTAMP WITH TIME ZONE | Ingestion timestamp |
| processed | BOOLEAN | Flag for downstream processing |

### agents_state
| Column | Type | Description |
|---|---|---|
| agent_name | VARCHAR(50) PK | Name of the agent |
| last_heartbeat | TIMESTAMP WITH TIME ZONE | Last health check |
| status | VARCHAR(20) | `healthy`, `degraded`, `failed` |
| config | JSONB | Agent configuration |

### incidents
| Column | Type | Description |
|---|---|---|
| incident_id | UUID PK | Unique incident identifier |
| title | VARCHAR(200) | Brief description |
| severity | VARCHAR(10) | Low/Medium/High/Critical |
| risk_score | FLOAT | Aggregated risk score |
| timeline | JSONB | Sequence of correlated events |
| report | TEXT | Explainable AI generated report |
| created_at | TIMESTAMP WITH TIME ZONE |
| status | VARCHAR(20) |

### risk_scores
| Column | Type | Description |
|---|---|---|
| event_id | UUID FK -> security_events.id |
| model | VARCHAR(50) | Model used (IsolationForest, XGBoost) |
| score | FLOAT |
| generated_at | TIMESTAMP WITH TIME ZONE |

### audit_logs
| Column | Type | Description |
|---|---|---|
| log_id | BIGSERIAL PK |
| action | VARCHAR(100) |
| user | VARCHAR(100) |
| timestamp | TIMESTAMP WITH TIME ZONE |
| details | JSONB |

All tables are in the `public` schema of PostgreSQL. Indexes on `source`, `received_at`, and `severity` are recommended for performance.
