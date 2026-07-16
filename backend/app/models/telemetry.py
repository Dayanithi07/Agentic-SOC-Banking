from __future__ import annotations
from datetime import datetime
from typing import List, Literal, Dict, Any
from pydantic import BaseModel, Field

class BaseTelemetry(BaseModel):
    " Common fields shared by every telemetry event.
    event_id: str = Field(..., description=Globally unique identifier)
 source: Literal[iam, edr, database, network, policy] = Field(..., description=Originating security product)
 timestamp: datetime = Field(default_factory=datetime.utcnow)
 raw: Dict[str, Any] = Field(..., description=Raw payload from the source)

class IAMEvent(BaseTelemetry):
 source: Literal[iam] = iam
 user: str
 action: str
 resource: str
 success: bool

class EDREvent(BaseTelemetry):
 source: Literal[edr] = edr
 host: str
 process: str
 event_type: str
 severity: int
