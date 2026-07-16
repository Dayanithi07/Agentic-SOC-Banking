import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy' | 'error';
  icon: string;
  source: string;
  eventsProcessed: number;
  lastRun: string;
  avgResponseMs: number;
  capabilities: string[];
  description: string;
}

const AGENTS: Agent[] = [
  {
    id: '1', name: 'SOC Coordinator', role: 'Orchestrator', icon: '🧠', status: 'active',
    source: 'Internal', eventsProcessed: 1842, lastRun: '12s ago', avgResponseMs: 230,
    capabilities: ['Multi-agent orchestration', 'Alert prioritisation', 'Incident escalation', 'AI explanation generation'],
    description: 'Central coordinator that manages all sub-agents, aggregates findings, and generates executive-level risk summaries using Gemini AI.',
  },
  {
    id: '2', name: 'IAM Agent', role: 'Identity & Access Management', icon: '🔑', status: 'active',
    source: 'Azure AD / Okta', eventsProcessed: 543, lastRun: '45s ago', avgResponseMs: 180,
    capabilities: ['Login anomaly detection', 'MFA bypass detection', 'Privilege escalation alerts', 'Account compromise scoring'],
    description: 'Monitors identity events from Azure AD and Okta. Detects credential stuffing, brute force, MFA abuse, and suspicious authentication patterns.',
  },
  {
    id: '3', name: 'EDR Agent', role: 'Endpoint Detection & Response', icon: '💻', status: 'active',
    source: 'CrowdStrike / SentinelOne', eventsProcessed: 329, lastRun: '1m ago', avgResponseMs: 210,
    capabilities: ['Malware detection', 'Lateral movement tracking', 'Process injection alerts', 'Endpoint quarantine triggers'],
    description: 'Analyses endpoint telemetry from CrowdStrike and SentinelOne to detect malware, ransomware, lateral movement, and process injection attacks.',
  },
  {
    id: '4', name: 'Network Agent', role: 'Network Monitoring', icon: '🌐', status: 'busy',
    source: 'Palo Alto NGFW', eventsProcessed: 2104, lastRun: 'Now', avgResponseMs: 95,
    capabilities: ['Traffic anomaly detection', 'C2 communication alerts', 'DDoS pattern recognition', 'Port scan detection'],
    description: 'Continuously monitors network flows from Palo Alto NGFW. Currently analysing elevated east-west traffic between internal subnets.',
  },
  {
    id: '5', name: 'Firewall Agent', role: 'Perimeter Security', icon: '🛡️', status: 'idle',
    source: 'Palo Alto / Cisco', eventsProcessed: 891, lastRun: '5m ago', avgResponseMs: 140,
    capabilities: ['Inbound threat blocking', 'Policy violation detection', 'Geo-blocking rules', 'Rule conflict analysis'],
    description: 'Analyses perimeter firewall logs from Palo Alto and Cisco ASA. Detects policy violations, unauthorised access attempts, and rule misconfiguration.',
  },
  {
    id: '6', name: 'PAM Agent', role: 'Privileged Access Management', icon: '🔐', status: 'active',
    source: 'Cisco Duo / CyberArk', eventsProcessed: 217, lastRun: '2m ago', avgResponseMs: 195,
    capabilities: ['Privileged session monitoring', 'Admin command auditing', 'Vault access tracking', 'Just-in-time access analysis'],
    description: 'Monitors privileged account usage through Cisco Duo MFA and CyberArk vault sessions. Detects unauthorized admin commands and vault access anomalies.',
  },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(0,229,176,0.1)', color: 'var(--teal)',     label: 'ACTIVE'  },
  idle:   { bg: 'rgba(74,108,138,0.1)', color: 'var(--text-muted)', label: 'IDLE'  },
  busy:   { bg: 'rgba(255,217,61,0.1)', color: 'var(--medium)',   label: 'BUSY'   },
  error:  { bg: 'rgba(255,59,107,0.1)', color: 'var(--critical)', label: 'ERROR'  },
};

export const AIAgents: React.FC = () => {
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <div className="main-content">
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>🤖 AI Agents</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Autonomous security agents monitoring your banking infrastructure 24/7
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid-4">
        <div className="stat-card"><span className="stat-card__label">Total Agents</span><span className="stat-card__value">6</span></div>
        <div className="stat-card"><span className="stat-card__label">Active</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{AGENTS.filter(a => a.status === 'active').length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Busy</span><span className="stat-card__value" style={{ color: 'var(--medium)' }}>{AGENTS.filter(a => a.status === 'busy').length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Events Today</span><span className="stat-card__value">{AGENTS.reduce((s, a) => s + a.eventsProcessed, 0).toLocaleString()}</span></div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid-3">
        {AGENTS.map((agent, i) => {
          const ss = STATUS_STYLE[agent.status];
          return (
            <div
              key={agent.id}
              className="card anim-fade-up"
              style={{ cursor: 'pointer', animationDelay: `${i * 60}ms` }}
              onClick={() => setSelected(agent)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    {agent.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{agent.role}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: ss.bg, color: ss.color }}>
                  {ss.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  ['Source', agent.source],
                  ['Last Run', agent.lastRun],
                  ['Events', agent.eventsProcessed.toLocaleString()],
                  ['Avg Response', `${agent.avgResponseMs}ms`],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '6px 10px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {agent.capabilities.slice(0, 2).map(cap => (
                  <span key={cap} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 999, background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid var(--border-active)' }}>
                    {cap}
                  </span>
                ))}
                {agent.capabilities.length > 2 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    +{agent.capabilities.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Detail Modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelected(null)}
        >
          <div
            className="card"
            style={{ width: 560, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                  {selected.icon}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selected.name}</h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selected.role}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{selected.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['Data Source',    selected.source],
                ['Last Run',       selected.lastRun],
                ['Events Processed', selected.eventsProcessed.toLocaleString()],
                ['Avg Response',   `${selected.avgResponseMs} ms`],
                ['Status',         STATUS_STYLE[selected.status].label],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: 4, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capabilities</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.capabilities.map(cap => (
                  <div key={cap} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--teal)' }}>✓</span> {cap}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn--primary">Force Run Agent</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
