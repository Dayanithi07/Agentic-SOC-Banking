import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Float
from app.database.connection import Base

class ApplicationDB(Base):
    __tablename__ = "applications"
    
    id = Column(String, primary_key=True, default=lambda: f"app-{uuid.uuid4().hex[:8]}")
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: f"usr-{uuid.uuid4().hex[:8]}")
    username = Column(String, unique=True, nullable=False)
    role = Column(String, default="customer")
    created_at = Column(DateTime, default=datetime.utcnow)

class SecurityEventDB(Base):
    __tablename__ = "security_events"
    
    event_id = Column(String, primary_key=True, default=lambda: f"evt-{uuid.uuid4().hex[:8]}")
    timestamp = Column(String, nullable=False)
    source = Column(String, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    event_type = Column(String, nullable=False)
    user_id = Column(String, nullable=True)
    role = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    http_method = Column(String, nullable=True)
    resource = Column(String, nullable=True)
    status = Column(String, nullable=True)
    severity = Column(String, nullable=False)
    correlation_id = Column(String, nullable=True)
    mitre_tactic = Column(String, nullable=True)
    mitre_technique = Column(String, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)

class FindingDB(Base):
    __tablename__ = "security_findings"
    
    finding_id = Column(String, primary_key=True, default=lambda: f"fnd-{uuid.uuid4().hex[:8]}")
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    affected_endpoint = Column(String, nullable=True)
    evidence = Column(String, nullable=True)
    status = Column(String, default="Open")
    risk_score = Column(Integer, default=0)
    mitre_tactic = Column(String, nullable=True)
    mitre_technique = Column(String, nullable=True)
    remediation = Column(String, nullable=True)
    cvss_score = Column(Float, nullable=True)
    related_event_ids = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AgentRunDB(Base):
    __tablename__ = "agent_runs"
    
    run_id = Column(String, primary_key=True, default=lambda: f"run-{uuid.uuid4().hex[:8]}")
    agent_name = Column(String, nullable=False)
    trigger_event_id = Column(String, nullable=True)
    status = Column(String, default="completed")
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IncidentDB(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String, primary_key=True, default=lambda: f"inc-{uuid.uuid4().hex[:8]}")
    title = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    risk_score = Column(Integer, default=0)
    status = Column(String, default="new")
    recommendation = Column(String, nullable=True)
    ai_explanation = Column(String, nullable=True)
    mitre_tactics = Column(JSON, default=list)
    mitre_techniques = Column(JSON, default=list)
    related_event_ids = Column(JSON, default=list)
    related_finding_ids = Column(JSON, default=list)
    evidence_chain = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
