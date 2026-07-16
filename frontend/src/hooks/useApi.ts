import type { TelemetryEvent, DashboardStats, AgentMessage } from '../types';

const SOURCES  = ['Azure AD', 'CrowdStrike', 'SentinelOne', 'Palo Alto', 'Cisco Duo', 'Okta'];
const EV_TYPES = [
  'Login Failure', 'Brute Force', 'MFA Bypass', 'Lateral Movement',
  'Data Exfiltration', 'Privilege Escalation', 'Policy Violation', 'Anomalous Transfer',
];
const USERS = ['john.smith', 'priya.nair', 'admin', 'svc-account', 'api-gateway', 'ravi.kumar', 'chen.wei'];
const DESCS = [
  'Multiple failed login attempts detected from suspicious IP address',
  'Unusual data access pattern detected outside business hours',
  'MFA token reuse detected from two geographic locations',
  'Lateral movement detected across internal subnets',
  'Large volume data export to external cloud storage detected',
  'Privilege escalation attempt on core banking server',
  'Policy violation: access to restricted customer records',
  'Anomalous high-value transaction pattern detected',
];
const EXPLANATIONS = [
  'AI analysis indicates credential stuffing attack. Recommend account lockout and password reset.',
  'Behavioral baseline deviation detected. This user typically operates 9-5 IST, not at 2 AM.',
  'Token reuse from two cities within 4 minutes is physically impossible. Likely account compromise.',
  'Network telemetry shows sequential access to 14 internal hosts — classic lateral movement signature.',
  '250 GB transferred to unknown S3 bucket. High confidence data exfiltration. Immediate response required.',
  'SU privilege commands executed without prior change-ticket. Potential insider threat.',
  'Access to PII records beyond user job scope. Matches insider threat behavioral pattern.',
  'Transaction velocity 300% above baseline. Cross-channel fraud pattern detected by ML model.',
];

const SEVERITIES: TelemetryEvent['severity'][] = ['critical', 'high', 'medium', 'low'];

let _counter = 0;

function makeEvent(): TelemetryEvent {
  const idx = Math.floor(Math.random() * EV_TYPES.length);
  const si  = Math.floor(Math.random() * SEVERITIES.length);
  const sev = SEVERITIES[si];
  const risk = sev === 'critical' ? 85 + Math.random() * 15
             : sev === 'high'     ? 60 + Math.random() * 25
             : sev === 'medium'   ? 35 + Math.random() * 25
             : 10 + Math.random() * 25;
  return {
    id:             `evt-${++_counter}-${Date.now()}`,
    source:         SOURCES[Math.floor(Math.random() * SOURCES.length)],
    event_type:     EV_TYPES[idx],
    severity:       sev,
    timestamp:      new Date(Date.now() - Math.random() * 3_600_000).toISOString(),
    user:           USERS[Math.floor(Math.random() * USERS.length)],
    description:    DESCS[idx % DESCS.length],
    risk_score:     Math.round(risk),
    ai_explanation: EXPLANATIONS[idx % EXPLANATIONS.length],
    status:         'new',
  };
}

export function generateEvents(n = 20): TelemetryEvent[] {
  return Array.from({ length: n }, makeEvent)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateStats(events: TelemetryEvent[]): DashboardStats {
  const total = events.length;
  return {
    total_events:     total,
    critical_alerts:  events.filter(e => e.severity === 'critical').length,
    active_agents:    6,
    threats_resolved: Math.floor(total * 0.35),
    avg_risk_score:   total ? Math.round(events.reduce((s, e) => s + e.risk_score, 0) / total) : 0,
    events_last_hour: events.filter(e => Date.now() - new Date(e.timestamp).getTime() < 3_600_000).length,
  };
}

export async function fetchRunCycle(): Promise<{ events: TelemetryEvent[]; message: string }> {
  try {
    const res = await fetch('/api/run-cycle', { method: 'POST' });
    if (res.ok) return await res.json();
  } catch { /* fall through to mock */ }
  await new Promise(r => setTimeout(r, 800));
  return { events: generateEvents(5), message: 'Agent cycle complete (demo mode)' };
}

export async function chatWithAgent(
  _history: AgentMessage[],
  userInput: string,
): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput }),
    });
    if (res.ok) return (await res.json()).response;
  } catch { /* fall through */ }
  await new Promise(r => setTimeout(r, 600));
  const q = userInput.toLowerCase();
  if (q.includes('critical'))   return 'Current critical alerts require immediate attention. Top priority: MFA bypass attempts from Azure AD and lateral movement across subnets. Recommend immediate account lockout.';
  if (q.includes('risk'))       return 'Average risk score is elevated at 74/100. Primary contributors: Lateral Movement events (avg 91) and MFA Bypass attempts (avg 87). Recommend activating incident response.';
  if (q.includes('agent'))      return 'All 6 AI agents are active: IAM, EDR, Network, Firewall, PAM, and Coordinator. Network Agent is currently busy analysing subnet traffic. Zero errors in the last cycle.';
  if (q.includes('recommend'))  return 'Recommendations: 1) Enforce MFA on all admin accounts. 2) Block suspicious IPs at Palo Alto. 3) Rotate compromised service account credentials. 4) Enable anomaly alerting on high-value transfers.';
  if (q.includes('status'))     return 'SOC operational. 6 agents active, 4 data sources streaming, 0 system errors. Last detection cycle completed 32 seconds ago. 3 open investigations in progress.';
  return 'SOC Copilot is monitoring 6 security data sources in real time. I can help with threat analysis, risk assessment, agent status, and remediation recommendations. What would you like to know?';
}

// ─── WebSocket live stream ───────────────────────────────────────────────────
// Connects to the backend /ws/telemetry endpoint and streams new events.
// Falls back gracefully if the backend is not available.
export function useWebSocketStream(
  onEvent: (event: TelemetryEvent) => void,
): () => void {
  const WS_URL = window.location.protocol === 'https:'
    ? `wss://${window.location.host}/ws/telemetry`
    : `ws://localhost:8000/ws/telemetry`;

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    try {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data) as TelemetryEvent;
          onEvent(event);
        } catch { /* ignore malformed */ }
      };
      ws.onerror = () => { ws?.close(); };
      ws.onclose = () => {
        // Reconnect after 5 s if backend goes away
        reconnectTimer = setTimeout(connect, 5_000);
      };
    } catch { /* WebSocket not available */ }
  }

  connect();

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
