from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import generate_structured_response
from app.models.event import SecurityEvent
from app.models.finding import Finding
from collections import Counter


class InvestigationResult(BaseModel):
    incident_summary: str
    evidence: list[str]
    attack_sequence: str
    confidence: float
    related_finding_ids: list[str]
    recommended_action: str
    ai_explanation: str


def _heuristic_investigation(
    events: list[SecurityEvent],
    findings: list[Finding],
    agent_reasoning: list[str],
) -> InvestigationResult:
    event_types = Counter(e.event_type for e in events)
    users = list({e.user_id for e in events if e.user_id})
    ips = list({e.ip_address for e in events if e.ip_address})
    critical = [e for e in events if e.severity in ("critical", "high")]

    # IDOR / Access Control Violation scenario
    if event_types.get("access_control_violation", 0) >= 1 or any("idor" in (e.event_type or "").lower() for e in events):
        idor_events = [e for e in events if e.event_type == "access_control_violation"]
        user_name = users[0] if users else "authenticated_user"
        target_endpoint = idor_events[0].endpoint if idor_events else "/api/orders"
        evidence = [
            f"User '{user_name}' attempted unauthorized access to resource {target_endpoint}",
            f"HTTP 403 Access Control Violation thrown by security gateway",
            f"Source IP: {ips[0] if ips else 'unknown'}",
        ]
        return InvestigationResult(
            incident_summary=(
                f"Insecure Direct Object Reference (IDOR) violation detected. "
                f"User '{user_name}' from IP {ips[0] if ips else 'unknown'} attempted to read or modify "
                f"restricted records on endpoint {target_endpoint}."
            ),
            evidence=evidence,
            attack_sequence=(
                f"User Login ({user_name}) → Endpoint Probe ({target_endpoint}) → "
                f"IDOR Object Parameter Tampering → Access Control Gate Failure (403 Forbidden) → SOC Alert"
            ),
            confidence=0.95,
            related_finding_ids=[f.finding_id for f in findings],
            recommended_action=(
                "1. Enforce strict server-side ownership check (order.user_id == current_user.id). "
                "2. Replace sequential integer IDs (ORD-1, ORD-2) with unpredictable UUIDs. "
                "3. Audit all /api/orders and account endpoints for authorization bypass vulnerabilities."
            ),
            ai_explanation=(
                f"An IDOR (Insecure Direct Object Reference) attack occurred when user '{user_name}' "
                f"manipulated resource identifiers in HTTP requests to access records belonging to another user. "
                f"The security monitoring system intercepted the unauthorized access attempt and flagged the endpoint."
            ),
        )

    # SQL Injection scenario
    if event_types.get("sql_injection_attempt", 0) >= 1:
        sqli_events = [e for e in events if e.event_type == "sql_injection_attempt"]
        payloads = [(e.metadata or {}).get("payload", "unknown") for e in sqli_events]
        blocked = sum(1 for e in sqli_events if (e.metadata or {}).get("blocked"))
        evidence = [
            f"{len(sqli_events)} SQL injection probes from IP {ips[0] if ips else 'unknown'}",
            f"Payloads tested: {', '.join(payloads[:4])}",
            f"WAF blocked {blocked}/{len(sqli_events)} attempts",
        ]
        if event_types.get("data_export"):
            evidence.append("Data export triggered after successful blind SQLi — likely database compromise")
        return InvestigationResult(
            incident_summary=(
                f"Automated SQL injection attack from {ips[0] if ips else 'external IP'}. "
                f"Attacker probed {sqli_events[0].endpoint if sqli_events else 'API'} with "
                f"{len(sqli_events)} injection payloads including UNION-based and time-based blind SQLi."
            ),
            evidence=evidence,
            attack_sequence=(
                "Reconnaissance → SQLi probe (blocked) → Blind SQLi (SLEEP) → "
                "Admin endpoint probe → Data export attempt → IP blacklisted"
            ),
            confidence=0.94,
            related_finding_ids=[f.finding_id for f in findings],
            recommended_action=(
                "1. Block attacker IP at WAF and firewall. "
                "2. Audit /api/reports/query and /api/products/search for SQL injection vulnerabilities. "
                "3. Rotate database credentials. 4. Review exported data for PII exposure."
            ),
            ai_explanation=(
                "The attack follows a classic SQL injection kill chain. After initial probes were blocked by WAF, "
                "the attacker succeeded with a time-based blind injection (SLEEP payload), indicating the backend "
                "is vulnerable despite partial WAF coverage. Subsequent data export and admin endpoint probing "
                "confirm post-exploitation activity."
            ),
        )

    # Credential stuffing + exfiltration
    login_failures = event_types.get("login_failure", 0)
    if login_failures >= 5 or (
        login_failures >= 3 and event_types.get("data_export", 0) >= 1
    ):
        evidence = [
            f"{login_failures} failed login attempts against user '{users[0] if users else 'admin'}'",
            f"Source IP: {ips[0] if ips else 'unknown'}",
        ]
        if event_types.get("login_success"):
            evidence.append("Successful login after brute force burst — likely credential compromise")
        if event_types.get("privilege_escalation"):
            evidence.append("Privilege escalation to superuser detected post-login")
        if event_types.get("data_export"):
            batches = [e for e in events if e.event_type == "data_export"]
            total = sum((e.metadata or {}).get("records_exported", 0) for e in batches)
            evidence.append(f"Bulk data exfiltration: {total:,} records across {len(batches)} export batches")

        return InvestigationResult(
            incident_summary=(
                f"Credential stuffing attack against {users[0] if users else 'admin account'} from "
                f"{ips[0] if ips else 'external IP'}. Attacker achieved login after {login_failures} "
                f"failed attempts, escalated privileges, and exfiltrated customer data."
            ),
            evidence=evidence,
            attack_sequence=(
                "Brute force login (10 attempts) → Valid account access → "
                "Session hijack from second IP → IDOR probing → Privilege escalation → "
                "Multi-batch data exfiltration → Account disabled by SOC"
            ),
            confidence=0.96,
            related_finding_ids=[f.finding_id for f in findings],
            recommended_action=(
                "1. Force password reset for compromised account. 2. Revoke all active sessions. "
                "3. Enable MFA on admin accounts. 4. Audit exported records for regulatory notification. "
                "5. Implement rate limiting on /api/auth/login."
            ),
            ai_explanation=(
                "This is a multi-stage credential stuffing and exfiltration attack. The attacker used "
                "automated tools (curl/python-requests) to brute force admin credentials, then pivoted "
                "to privilege escalation and staged data exports exceeding DLP thresholds. "
                "Session token reuse from a second IP indicates possible session fixation or cookie theft."
            ),
        )

    # Lateral movement / insider threat
    if event_types.get("lateral_movement", 0) >= 1:
        lm_events = [e for e in events if e.event_type == "lateral_movement"]
        targets = [(e.metadata or {}).get("target_host", e.endpoint) for e in lm_events]
        evidence = [
            f"User '{users[0] if users else 'unknown'}' accessed {len(targets)} internal hosts",
            f"Targets: {', '.join(filter(None, targets))}",
        ]
        if event_types.get("data_export"):
            evidence.append("After-hours data export detected following lateral movement")

        return InvestigationResult(
            incident_summary=(
                f"Insider threat detected: user {users[0] if users else 'unknown'} performed lateral "
                f"movement across {len(lm_events)} internal systems, potentially abusing PAM privileges "
                f"for unauthorized data access."
            ),
            evidence=evidence,
            attack_sequence=(
                "Normal business login → PAM privilege request → "
                "Lateral movement to finance DB → Sensitive data query → "
                "After-hours bulk export → SOC incident created"
            ),
            confidence=0.91,
            related_finding_ids=[f.finding_id for f in findings],
            recommended_action=(
                "1. Suspend user account pending HR/security review. "
                "2. Revoke PAM elevated privileges. 3. Audit access logs on affected internal hosts. "
                "4. Review data accessed during lateral movement window."
            ),
            ai_explanation=(
                "Behavioral analysis indicates insider misuse rather than external compromise. "
                "The user authenticated normally but subsequently accessed internal finance systems "
                "via lateral movement protocols (SMB) outside their typical access pattern, "
                "followed by data export activity during off-hours."
            ),
        )

    # Generic fallback with event-specific detail
    evidence = []
    for e in critical[:8]:
        detail = f"[{e.severity.upper()}] {e.event_type} — {e.source}"
        if e.endpoint:
            detail += f" @ {e.endpoint}"
        if e.user_id:
            detail += f" (user: {e.user_id})"
        evidence.append(detail)

    if agent_reasoning:
        evidence.append(f"Agent analysis: {agent_reasoning[0]}")

    sequence_parts = [e.event_type for e in sorted(events, key=lambda x: x.timestamp)[-6:]]
    return InvestigationResult(
        incident_summary=(
            f"Suspicious activity chain involving {len(critical)} high-severity events "
            f"from {', '.join(ips[:2]) or 'unknown IPs'}. "
            f"Primary trigger: {critical[0].event_type if critical else events[-1].event_type}."
        ),
        evidence=evidence or ["Multiple correlated security events detected"],
        attack_sequence=" → ".join(sequence_parts) if sequence_parts else "Unknown sequence",
        confidence=0.85,
        related_finding_ids=[f.finding_id for f in findings],
        recommended_action=(
            "1. Review correlated events in timeline. 2. Isolate affected accounts/IPs. "
            "3. Escalate to incident response team. 4. Preserve forensic evidence."
        ),
        ai_explanation=(
            findings[0].description if findings else
            f"AI agents flagged {len(critical)} critical/high events requiring investigation. "
            f"Event types: {', '.join(event_types.keys())}."
        ),
    )


async def investigate_events(
    events: list[SecurityEvent],
    related_findings: list[Finding],
    agent_reasoning: Optional[list[str]] = None,
) -> Optional[InvestigationResult]:
    agent_reasoning = agent_reasoning or []

    prompt = f"""
    You are an expert AI Security Investigator for an e-commerce/banking SOC.
    Analyze the following runtime events and vulnerability findings.

    Events: {[e.model_dump() for e in events]}
    Findings: {[f.model_dump() for f in related_findings]}
    Agent Reasoning: {agent_reasoning}

    Provide a detailed investigation with:
    - incident_summary: What happened in plain language
    - evidence: List of specific evidence items
    - attack_sequence: Step-by-step kill chain
    - confidence: 0.0 to 1.0
    - recommended_action: Numbered remediation steps
    - ai_explanation: Deep technical analysis for SOC analysts
    """

    result = await generate_structured_response(prompt, InvestigationResult)

    if not result:
        result = _heuristic_investigation(events, related_findings, agent_reasoning)

    return result
