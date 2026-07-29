from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime, timedelta
import uuid
import random

SeverityType = Literal["critical", "high", "medium", "low", "info"]
StatusType = Literal["new", "investigating", "resolved", "false_positive"]

class SecurityEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:8]}")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    source: str = "ecommerce_app"
    application_id: str = "shop-001"
    event_type: str
    user_id: Optional[str] = None
    role: Optional[str] = None
    ip_address: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    resource: Optional[str] = None
    status: Optional[str] = None
    severity: SeverityType = "info"
    correlation_id: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ── Event generation for /api/run-cycle and demo mode ──────────────────────

_SOURCES = ["IAM", "EDR", "WAF", "Database Audit", "Network Monitor", "PAM"]
_ENDPOINTS = [
    "/api/auth/login", "/api/products", "/api/cart", "/api/checkout",
    "/api/orders/{order_id}", "/api/admin/users", "/api/admin/config",
    "/api/payments/process", "/api/users/profile", "/api/reports/export",
]
_USERS = ["user_101", "user_202", "user_303", "admin", "svc-batch", "guest", "analyst_01"]
_IPS = [
    "192.168.1.10", "10.0.0.45", "172.16.0.8", "203.0.113.5",
    "198.51.100.12", "198.51.100.99", "45.33.32.156", "91.108.56.1",
]

_EVENT_TEMPLATES = [
    {
        "event_type": "login_failure",
        "severity": "medium",
        "source": "IAM",
        "endpoint": "/api/auth/login",
        "http_method": "POST",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "T1110 - Brute Force",
        "metadata": {"status_code": 401, "reason": "Invalid password"},
    },
    {
        "event_type": "login_success",
        "severity": "info",
        "source": "IAM",
        "endpoint": "/api/auth/login",
        "http_method": "POST",
        "mitre_tactic": None,
        "mitre_technique": None,
        "metadata": {"status_code": 200},
    },
    {
        "event_type": "access_control_violation",
        "severity": "critical",
        "source": "WAF",
        "endpoint": "/api/orders/{order_id}",
        "http_method": "GET",
        "mitre_tactic": "Privilege Escalation",
        "mitre_technique": "T1548 - Abuse Elevation Control Mechanism",
        "metadata": {"status_code": 403, "reason": "IDOR attempt"},
    },
    {
        "event_type": "privilege_escalation",
        "severity": "critical",
        "source": "PAM",
        "endpoint": "/api/admin/users",
        "http_method": "PUT",
        "mitre_tactic": "Privilege Escalation",
        "mitre_technique": "T1078 - Valid Accounts",
        "metadata": {"from_role": "customer", "to_role": "admin"},
    },
    {
        "event_type": "data_export",
        "severity": "high",
        "source": "Database Audit",
        "endpoint": "/api/reports/export",
        "http_method": "GET",
        "mitre_tactic": "Exfiltration",
        "mitre_technique": "T1041 - Exfiltration Over C2 Channel",
        "metadata": {"records_exported": random.randint(500, 5000), "format": "CSV"},
    },
    {
        "event_type": "sql_injection_attempt",
        "severity": "critical",
        "source": "WAF",
        "endpoint": "/api/products",
        "http_method": "GET",
        "mitre_tactic": "Initial Access",
        "mitre_technique": "T1190 - Exploit Public-Facing Application",
        "metadata": {"payload": "' OR 1=1 --", "blocked": True},
    },
    {
        "event_type": "lateral_movement",
        "severity": "high",
        "source": "Network Monitor",
        "endpoint": "/api/admin/config",
        "http_method": "GET",
        "mitre_tactic": "Lateral Movement",
        "mitre_technique": "T1021 - Remote Services",
        "metadata": {"hops": random.randint(2, 6), "source_subnet": "10.0.0.0/24"},
    },
    {
        "event_type": "session_hijack_attempt",
        "severity": "high",
        "source": "IAM",
        "endpoint": "/api/users/profile",
        "http_method": "GET",
        "mitre_tactic": "Credential Access",
        "mitre_technique": "T1539 - Steal Web Session Cookie",
        "metadata": {"ip_mismatch": True, "original_ip": "192.168.1.10"},
    },
    {
        "event_type": "web_request",
        "severity": "info",
        "source": "WAF",
        "endpoint": "/api/products",
        "http_method": "GET",
        "mitre_tactic": None,
        "mitre_technique": None,
        "metadata": {"status_code": 200},
    },
    {
        "event_type": "checkout_success",
        "severity": "info",
        "source": "ecommerce_app",
        "endpoint": "/api/checkout",
        "http_method": "POST",
        "mitre_tactic": None,
        "mitre_technique": None,
        "metadata": {"status_code": 200, "amount": round(random.uniform(10, 2000), 2)},
    },
]

# Probability weights: more benign events, fewer critical
_WEIGHTS = [8, 20, 4, 2, 5, 3, 4, 3, 30, 15]


def generate_events(n: int = 5) -> List["SecurityEvent"]:
    """Generate n synthetic security events with realistic distribution."""
    events = []
    for _ in range(n):
        template = random.choices(_EVENT_TEMPLATES, weights=_WEIGHTS, k=1)[0]
        evt = SecurityEvent(
            event_type=template["event_type"],
            severity=template["severity"],
            source=template["source"],
            endpoint=template.get("endpoint", random.choice(_ENDPOINTS)),
            http_method=template.get("http_method", "GET"),
            user_id=random.choice(_USERS),
            ip_address=random.choice(_IPS),
            mitre_tactic=template.get("mitre_tactic"),
            mitre_technique=template.get("mitre_technique"),
            timestamp=(datetime.utcnow() - timedelta(seconds=random.randint(0, 300))).isoformat() + "Z",
            metadata=dict(template.get("metadata", {})),
        )
        events.append(evt)
    return sorted(events, key=lambda e: e.timestamp, reverse=True)
