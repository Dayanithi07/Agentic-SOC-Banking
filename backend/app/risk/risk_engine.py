from app.models.finding import Finding
from app.models.event import SecurityEvent

class RiskEngine:
    SEVERITY_WEIGHTS = {
        "critical": 30,
        "high": 20,
        "medium": 10,
        "low": 5,
        "info": 0
    }
    
    def calculate_base_risk(self, finding: Finding) -> int:
        return self.SEVERITY_WEIGHTS.get(finding.severity.lower(), 10)
    
    def calculate_contextual_risk(self, finding: Finding, runtime_events: list[SecurityEvent]) -> int:
        base_score = self.calculate_base_risk(finding)
        
        # Runtime Activity (+20 if related endpoint is hit)
        runtime_activity_score = 0
        if any(e.endpoint == finding.affected_endpoint for e in runtime_events):
            runtime_activity_score = 20
            
        # Threat Evidence (+20 if multiple failures/violations)
        threat_evidence_score = 0
        violation_events = [e for e in runtime_events if e.severity in ["high", "critical"] or e.event_type in ["access_control_violation", "login_failure"]]
        if len(violation_events) > 2:
            threat_evidence_score = 20
        elif len(violation_events) > 0:
            threat_evidence_score = 10
            
        # Endpoint Sensitivity (+15 if it involves orders, auth, admin)
        sensitivity_score = 0
        if finding.affected_endpoint and any(x in finding.affected_endpoint for x in ["/orders", "/auth", "/admin", "/checkout"]):
            sensitivity_score = 15
            
        # Exposure (+15 if public/internet facing, we assume yes for now)
        exposure_score = 15
        
        total = base_score + runtime_activity_score + threat_evidence_score + sensitivity_score + exposure_score
        
        # Cap at 100
        return min(total, 100)

risk_engine = RiskEngine()
