import datetime
import uuid
from typing import List, Dict, Any

class CorrelationEngine:
    def __init__(self):
        # Default state
        self.logs: List[Dict[str, Any]] = [
            {
                "event_id": "l-001",
                "source": "iam",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=15)).isoformat() + "Z",
                "message": "Anomalous remote interactive login for user svc-database from IP 185.220.101.4"
            },
            {
                "event_id": "l-002",
                "source": "policy",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=14)).isoformat() + "Z",
                "message": "Security Policy Alert: Access attempt outside standard working hours (02:10 AM UTC)"
            },
            {
                "event_id": "l-003",
                "source": "iam",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=13)).isoformat() + "Z",
                "message": "Privilege elevation requested: user svc-database elevated to DBA Role via vault-session-812"
            },
            {
                "event_id": "l-004",
                "source": "database",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=11)).isoformat() + "Z",
                "message": "Anomalous Query Executed: SELECT * FROM customer_credit_cards LIMIT 1000000; (Role: DBA)"
            },
            {
                "event_id": "l-005",
                "source": "network",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=10)).isoformat() + "Z",
                "message": "Data egress warning: Outbound TCP session to 185.220.101.4 transferred 4.8 GB on port 443"
            },
            {
                "event_id": "l-006",
                "source": "edr",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=5)).isoformat() + "Z",
                "message": "Suspicious process execution: powershell.exe -ExecutionPolicy Bypass -File C:\\Users\\Public\\update.ps1"
            }
        ]
        
        self.incidents: List[Dict[str, Any]] = [
            {
                "id": "INC-2026-081",
                "title": "Privileged Insider Access Misuse & Database Exfiltration",
                "severity": "critical",
                "risk_score": 95,
                "status": "Open",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=15)).isoformat() + "Z",
                "agents": ["Identity Agent", "Database Agent", "Network Agent", "Policy Agent"],
                "explanation": "A collaborative analysis identified a critical multi-stage threat targeting sensitive banking databases. The attack vector indicates credential compromise of service account 'svc-database', followed by privilege escalation, unauthorized bulk database reads, and secure data exfiltration to a known Tor exit node IP.",
                "timeline": [
                    { "id": "t1", "source": "iam", "time": "14:10:05", "title": "Anomalous IAM Login", "desc": "Anomalous remote interactive login for user svc-database from IP 185.220.101.4 (Tor exit node)." },
                    { "id": "t2", "source": "policy", "time": "14:10:20", "title": "Policy Out of Hours Access", "desc": "Alert: Login occurred outside normal operating hours for this service account." },
                    { "id": "t3", "source": "iam", "time": "14:11:15", "title": "DBA Privilege Elevation", "desc": "Request granted elevating svc-database to high-privilege DBA credentials." },
                    { "id": "t4", "source": "database", "time": "14:12:45", "title": "Bulk Sensitive Read", "desc": "Query executed fetching 1,000,000 credit card entries from active customer database table." },
                    { "id": "t5", "source": "network", "time": "14:14:00", "title": "High Volume Data Egress", "desc": "4.8 GB outbound egress detected towards same destination IP (185.220.101.4) over port 443." }
                ],
                "mitre": ["Initial Access", "Privilege Escalation", "Credential Access", "Exfiltration"],
                "actions": [
                    { "id": "act-1", "name": "Revoke compromised LDAP keys", "desc": "Instantly terminate all active sessions for 'svc-database' and expire directory password.", "mitigated": False },
                    { "id": "act-2", "name": "Quarantine IP 185.220.101.4", "desc": "Update edge firewall policies to block outbound communication to the target exit node.", "mitigated": False },
                    { "id": "act-3", "name": "Database Session Terminate", "desc": "Kill active query engines and transactions associated with Vault token vault-session-812.", "mitigated": False }
                ]
            },
            {
                "id": "INC-2026-082",
                "title": "Anomalous PowerShell Execution & Ransomware Triage",
                "severity": "high",
                "risk_score": 82,
                "status": "Open",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=5)).isoformat() + "Z",
                "agents": ["Endpoint Agent", "Threat Intelligence Agent"],
                "explanation": "Identity and Endpoint telemetry detected a suspicious process execution command string executing under bypass mode. The command downloaded a binary whose hash correlates with ransomware payloads observed in recent industry campaigns.",
                "timeline": [
                    { "id": "t6", "source": "edr", "time": "14:15:30", "title": "Suspicious PowerShell Spawn", "desc": "powershell.exe executed with ExecutionPolicy Bypass to run C:\\Users\\Public\\update.ps1." },
                    { "id": "t7", "source": "edr", "time": "14:15:45", "title": "External Binary Download", "desc": "Process initiated curl request downloading executable payload.exe from temp site." }
                ],
                "mitre": ["Execution", "Defense Evasion"],
                "actions": [
                    { "id": "act-4", "name": "Quarantine Host via EDR", "desc": "Isolate host terminal-user-412 at the agent level to halt lateral network propagation.", "mitigated": False },
                    { "id": "act-5", "name": "Revoke AD Session tokens", "desc": "Terminate Kerberos ticket-granting tokens for current session users on target node.", "mitigated": False }
                ]
            }
        ]
        
        self.agents_status: List[Dict[str, Any]] = [
            { "name": "Identity Agent", "status": "Online", "verified_events": 142, "alerts_raised": 4, "type": "IAM/PAM Analysis" },
            { "name": "Endpoint Agent", "status": "Online", "verified_events": 894, "alerts_raised": 2, "type": "EDR Sysmon Telemetry" },
            { "name": "Database Agent", "status": "Online", "verified_events": 312, "alerts_raised": 1, "type": "Database Audits" },
            { "name": "Network Agent", "status": "Online", "verified_events": 1042, "alerts_raised": 1, "type": "NetFlow & Zeek Logs" },
            { "name": "Threat Intelligence Agent", "status": "Online", "verified_events": 75, "alerts_raised": 2, "type": "IOC Feed Correlator" },
            { "name": "Policy Agent", "status": "Online", "verified_events": 512, "alerts_raised": 1, "type": "GPO & Access Controls" }
        ]

    def add_log(self, source: str, message: str) -> Dict[str, Any]:
        log_entry = {
            "event_id": f"l-{uuid.uuid4().hex[:6]}",
            "source": source,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "message": message
        }
        self.logs.insert(0, log_entry)
        
        # Increment agent metrics based on log source
        source_map = {
            "iam": "Identity Agent",
            "edr": "Endpoint Agent",
            "database": "Database Agent",
            "network": "Network Agent",
            "policy": "Policy Agent"
        }
        agent_name = source_map.get(source)
        if agent_name:
            for agent in self.agents_status:
                if agent["name"] == agent_name:
                    agent["verified_events"] += 1
                    
        return log_entry

    def list_logs(self) -> List[Dict[str, Any]]:
        return self.logs

    def list_incidents(self) -> List[Dict[str, Any]]:
        return self.incidents

    def mitigate_incident_action(self, incident_id: str, action_id: str) -> bool:
        for inc in self.incidents:
            if inc["id"] == incident_id:
                for act in inc["actions"]:
                    if act["id"] == action_id:
                        act["mitigated"] = True
                        
                # If all actions mitigated, resolve incident
                all_done = all(act["mitigated"] for act in inc["actions"])
                if all_done:
                    inc["status"] = "Remediated"
                return True
        return False

    def list_agents(self) -> List[Dict[str, Any]]:
        return self.agents_status

    def inject_scenario(self, scenario_name: str) -> int:
        now_str = datetime.datetime.utcnow().strftime("%H:%M:%S")
        if scenario_name == "insider_exfil":
            logs_to_inject = [
                ("iam", "Anomalous remote interactive login for user svc-database from IP 185.220.101.4"),
                ("policy", "Security Policy Alert: Access attempt outside standard working hours (02:10 AM UTC)"),
                ("iam", "Privilege elevation requested: user svc-database elevated to DBA Role via vault-session-812"),
                ("database", "Anomalous Query Executed: SELECT * FROM customer_credit_cards LIMIT 1000000; (Role: DBA)"),
                ("network", "Data egress warning: Outbound TCP session to 185.220.101.4 transferred 4.8 GB on port 443")
            ]
            
            # Inject logs
            for source, msg in logs_to_inject:
                self.add_log(source, msg)
                
            # Increment agents alerts raised
            for name in ["Identity Agent", "Database Agent", "Network Agent", "Policy Agent"]:
                for ag in self.agents_status:
                    if ag["name"] == name:
                        ag["alerts_raised"] += 1

            # Create correlated incident
            new_id = f"INC-2026-{uuid.uuid4().hex[:3].upper()}"
            self.incidents.insert(0, {
                "id": new_id,
                "title": f"Insider Access Privilege Misuse & Bulk Database Transfer ({now_str})",
                "severity": "critical",
                "risk_score": 98,
                "status": "Open",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "agents": ["Identity Agent", "Database Agent", "Network Agent", "Policy Agent"],
                "explanation": "Collaborative synthesis identified a recurring exfiltration vector targeting database vaults. Service account key usage matches unauthorized out-of-hours activity, executing high-volume table queries, and transferring the output via encrypted port 443 directly to a suspicious destination.",
                "timeline": [
                    { "id": "t-s1", "source": "iam", "time": now_str, "title": "Anomalous Login Detected", "desc": "Login from Tor IP 185.220.101.4 targeting database service account." },
                    { "id": "t-s2", "source": "policy", "time": now_str, "title": "Policy Out-Of-Hours Breach", "desc": "System rule violation: Accessing DB assets at 02:10 AM UTC." },
                    { "id": "t-s3", "source": "iam", "time": now_str, "title": "Elevated Privileges Granted", "desc": "Account elevated dynamically using vault DBA session credentials." },
                    { "id": "t-s4", "source": "database", "time": now_str, "title": "Bulk Query Issued", "desc": "Target table customer_credit_cards read via JDBC." },
                    { "id": "t-s5", "source": "network", "time": now_str, "title": "4.8 GB Ingress/Egress Stream", "desc": "Encrypted secure socket payload transfer to 185.220.101.4." }
                ],
                "mitre": ["Initial Access", "Privilege Escalation", "Credential Access", "Exfiltration"],
                "actions": [
                    { "id": "act-s1", "name": "Block egress IP target", "desc": "Add IP 185.220.101.4 to perimeter blocklists.", "mitigated": False },
                    { "id": "act-s2", "name": "Revoke Vault Access", "desc": "Revoke directory token vault-session-812 instantly.", "mitigated": False }
                ]
            })
            return len(logs_to_inject)

        elif scenario_name == "ransomware":
            logs_to_inject = [
                ("edr", "Suspicious process execution: powershell.exe -ExecutionPolicy Bypass -File C:\\Users\\Public\\update.ps1"),
                ("edr", "Ransomware threat pattern identified: file mass encryption initiated in folder /shared/bank_records")
            ]
            
            for source, msg in logs_to_inject:
                self.add_log(source, msg)
                
            for name in ["Endpoint Agent", "Threat Intelligence Agent"]:
                for ag in self.agents_status:
                    if ag["name"] == name:
                        ag["alerts_raised"] += 1
                        
            new_id = f"INC-2026-{uuid.uuid4().hex[:3].upper()}"
            self.incidents.insert(0, {
                "id": new_id,
                "title": f"Endpoint EDR Ransomware Attack Signature ({now_str})",
                "severity": "high",
                "risk_score": 88,
                "status": "Open",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "agents": ["Endpoint Agent", "Threat Intelligence Agent"],
                "explanation": "Endpoint monitoring triggered alerts indicating execution of script bypass commands. The script immediately initiated high-frequency file rewrites matching standard ransomware encryption signatures.",
                "timeline": [
                    { "id": "t-r1", "source": "edr", "time": now_str, "title": "PowerShell Command Bypass", "desc": "powershell.exe executed with execution policy bypass flags." },
                    { "id": "t-r2", "source": "edr", "time": now_str, "title": "Mass Folder Rewrites", "desc": "High frequency crypt file modifications on network share /shared/bank_records." }
                ],
                "mitre": ["Execution", "Defense Evasion"],
                "actions": [
                    { "id": "act-r1", "name": "EDR Host Quarantine", "desc": "Isolate the target endpoint immediately.", "mitigated": False }
                ]
            })
            return len(logs_to_inject)
            
        return 0

# Shared global instance of the engine
engine = CorrelationEngine()
