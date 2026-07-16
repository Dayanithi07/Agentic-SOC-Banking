from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid, random

SOURCES   = ["Azure AD", "CrowdStrike", "SentinelOne", "Palo Alto", "Cisco Duo", "Okta"]
EV_TYPES  = [
    "Login Failure", "Brute Force", "MFA Bypass", "Lateral Movement",
    "Data Exfiltration", "Privilege Escalation", "Policy Violation", "Anomalous Transfer",
]
USERS = ["john.smith", "priya.nair", "admin", "svc-account", "api-gateway", "ravi.kumar"]
DESCS = [
    "Multiple failed login attempts detected from suspicious IP address",
    "Unusual data access pattern detected outside business hours",
    "MFA token reuse detected from two geographic locations",
    "Lateral movement detected across internal subnets",
    "Large volume data export to external cloud storage detected",
    "Privilege escalation attempt on core banking server",
    "Policy violation: access to restricted customer records",
    "Anomalous high-value transaction pattern detected",
]
AI_EXPLANATIONS = [
    "Credential stuffing attack pattern detected. Recommend account lockout and password reset.",
    "Behavioral baseline deviation: user typically operates 9-5 IST. Anomaly score: HIGH.",
    "Token reuse from 2 cities within 4 minutes is physically impossible. Likely account compromise.",
    "Sequential access to 14 internal hosts — classic lateral movement signature. Isolate endpoint.",
    "250 GB transferred to unknown S3 bucket. High confidence data exfiltration. Immediate response needed.",
    "SU privilege commands without change-ticket. Potential insider threat or compromised account.",
    "Access to PII records beyond user job scope. Matches insider threat behavioral pattern.",
    "Transaction velocity 300% above baseline. Cross-channel fraud pattern detected by ML model.",
]
SEVERITIES: list = ["critical", "high", "medium", "low"]

SeverityType = Literal["critical", "high", "medium", "low", "info"]
StatusType   = Literal["new", "investigating", "resolved", "false_positive"]


class TelemetryEvent(BaseModel):
    id:             str  = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:8]}")
    source:         str
    event_type:     str
    severity:       SeverityType
    timestamp:      str  = Field(default_factory=lambda: datetime.utcnow().isoformat())
    user:           Optional[str] = None
    description:    str
    risk_score:     int
    ai_explanation: Optional[str] = None
    status:         StatusType = "new"


def make_event() -> TelemetryEvent:
    idx  = random.randint(0, len(EV_TYPES) - 1)
    sev  = random.choices(SEVERITIES, weights=[15, 30, 35, 20])[0]
    risk = (
        random.randint(85, 99) if sev == "critical" else
        random.randint(60, 84) if sev == "high"     else
        random.randint(35, 59) if sev == "medium"   else
        random.randint(10, 34)
    )
    return TelemetryEvent(
        source         = random.choice(SOURCES),
        event_type     = EV_TYPES[idx],
        severity       = sev,  # type: ignore
        user           = random.choice(USERS),
        description    = DESCS[idx % len(DESCS)],
        risk_score     = risk,
        ai_explanation = AI_EXPLANATIONS[idx % len(AI_EXPLANATIONS)],
    )


def generate_events(n: int = 10) -> list[TelemetryEvent]:
    return [make_event() for _ in range(n)]
