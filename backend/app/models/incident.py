from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class Incident(BaseModel):
    incident_id: str = Field(default_factory=lambda: f"inc-{uuid.uuid4().hex[:8]}")
    title: str
    summary: str
    risk_score: int = 0
    status: str = "new"  # new, acknowledged, investigating, resolved, false_positive
    recommendation: Optional[str] = None
    ai_explanation: Optional[str] = None
    mitre_tactics: List[str] = Field(default_factory=list)
    mitre_techniques: List[str] = Field(default_factory=list)
    related_event_ids: List[str] = Field(default_factory=list)
    related_finding_ids: List[str] = Field(default_factory=list)
    evidence_chain: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
