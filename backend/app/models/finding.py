from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Finding(BaseModel):
    finding_id: str = Field(default_factory=lambda: f"fnd-{uuid.uuid4().hex[:8]}")
    application_id: str = "shop-001"
    title: str
    category: str
    description: str
    severity: str
    affected_endpoint: Optional[str] = None
    evidence: Optional[str] = None
    status: str = "Open"
    risk_score: int = 0
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    remediation: Optional[str] = None
    cvss_score: Optional[float] = None
    related_event_ids: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

