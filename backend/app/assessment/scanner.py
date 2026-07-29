from app.database.connection import async_session_maker
from app.database.models import FindingDB
from app.models.finding import Finding
import uuid

async def run_assessment() -> list[Finding]:
    findings_data = [
        {
            "title": "Broken Access Control",
            "category": "Authorization",
            "description": "Customer can access another customer's order by predicting the order_id.",
            "severity": "High",
            "affected_endpoint": "/api/orders/{order_id}",
            "evidence": "Insecure Direct Object Reference (IDOR) detected on order retrieval.",
            "risk_score": 85
        },
        {
            "title": "Weak Authentication Configuration",
            "category": "Authentication",
            "description": "Login endpoint lacks rate limiting.",
            "severity": "Medium",
            "affected_endpoint": "/api/auth/login",
            "evidence": "Allowed 50+ failed logins in 1 minute without blocking.",
            "risk_score": 55
        }
    ]
    
    saved_findings = []
    
    async with async_session_maker() as session:
        for f in findings_data:
            db_finding = FindingDB(
                finding_id=f"fnd-{uuid.uuid4().hex[:8]}",
                title=f["title"],
                category=f["category"],
                description=f["description"],
                severity=f["severity"],
                affected_endpoint=f["affected_endpoint"],
                evidence=f["evidence"],
                risk_score=f["risk_score"]
            )
            session.add(db_finding)
            
            # Map DB model to Pydantic model for return
            saved_findings.append(Finding(
                finding_id=db_finding.finding_id,
                title=db_finding.title,
                category=db_finding.category,
                description=db_finding.description,
                severity=db_finding.severity,
                affected_endpoint=db_finding.affected_endpoint,
                evidence=db_finding.evidence,
                risk_score=db_finding.risk_score
            ))
            
        await session.commit()
        
    return saved_findings
