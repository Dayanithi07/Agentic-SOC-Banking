# System Architecture

```mermaid
flowchart TD
    subgraph Telemetry
        IAM["IAM Logs"]
        PAM["PAM Logs"]
        EDR["EDR Events"]
        DB["Database Audits"]
        VPN["VPN Logs"]
        Net["Network Flow"]
    end
    Telemetry --> Collector["Telemetry Collector (Kafka)"
    Collector --> Normalizer["Normalization Engine"]
    Normalizer --> Agents["AI Agents"]
    Agents --> Coordinator["Coordinator Agent"]
    Coordinator --> RiskEngine["Risk Engine"]
    RiskEngine --> ExplainableAI["Explainable AI"]
    ExplainableAI --> Dashboard["SOC Dashboard (React)"]
    Dashboard --> Analyst["SOC Analyst"]
    Analyst -->|Feedback| Coordinator
    style Telemetry fill:#f9f,stroke:#333,stroke-width:2px
    style Collector fill:#bbf,stroke:#333,stroke-width:2px
    style Normalizer fill:#bfb,stroke:#333,stroke-width:2px
    style Agents fill:#ffb,stroke:#333,stroke-width:2px
    style Coordinator fill:#fbb,stroke:#333,stroke-width:2px
    style RiskEngine fill:#fbf,stroke:#333,stroke-width:2px
    style ExplainableAI fill:#bff,stroke:#333,stroke-width:2px
    style Dashboard fill:#fff,stroke:#333,stroke-width:2px
```

The architecture follows a layered approach (collection → normalization → agents → coordination → risk → explainability → UI). Each layer can be independently scaled and replaced.
