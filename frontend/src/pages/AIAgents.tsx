import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000';

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  eventsProcessed: number;
}

interface AgentRun {
  run_id: string;
  agent_name: string;
  trigger_event_id: string;
  status: string;
  result: any;
  created_at: string;
}

const AGENT_ICONS: Record<string, string> = {
  coordinator: '🧠',
  investigation: '🕵️',
  assessment: '🛡️',
  identity: '🔑',
  endpoint: '💻',
  database: '🗄️',
  network: '🌐',
  threat_intel: '🎯',
  policy: '📜',
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(0,229,176,0.1)', color: 'var(--teal)',       label: 'ACTIVE' },
  idle:   { bg: 'rgba(74,108,138,0.1)', color: 'var(--text-muted)', label: 'IDLE'   },
  busy:   { bg: 'rgba(255,217,61,0.1)', color: 'var(--medium)',     label: 'BUSY'   },
  error:  { bg: 'rgba(255,59,107,0.1)', color: 'var(--critical)',   label: 'ERROR'  },
};

export const AIAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [agRes, ruRes] = await Promise.all([
          fetch(`${API}/api/agents/status`),
          fetch(`${API}/api/agents/runs?limit=30`),
        ]);
        if (agRes.ok) setAgents(await agRes.json());
        if (ruRes.ok) setRuns(await ruRes.json());
      } catch (e) { console.error(e); }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalRuns = agents.reduce((s, a) => s + a.eventsProcessed, 0);
  const activeCount = agents.filter(a => a.status === 'active').length;

  return (
    <div className="main-content">
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>🤖 AI Agents</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          9 autonomous security agents monitoring the E-Commerce platform — auto-refreshes every 5s
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        <div className="stat-card"><span className="stat-card__label">Total Agents</span><span className="stat-card__value">{agents.length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Active</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{activeCount}</span></div>
        <div className="stat-card"><span className="stat-card__label">Total Runs</span><span className="stat-card__value" style={{ color: 'var(--medium)' }}>{totalRuns}</span></div>
        <div className="stat-card"><span className="stat-card__label">Recent Logs</span><span className="stat-card__value">{runs.length}</span></div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid-3" style={{ marginTop: '1rem' }}>
        {agents.map((agent, i) => {
          const ss = STATUS_STYLE[agent.status] || STATUS_STYLE.idle;
          const icon = AGENT_ICONS[agent.type] || '🤖';
          return (
            <div
              key={agent.id}
              className="card anim-fade-up"
              style={{ cursor: 'pointer', animationDelay: `${i * 50}ms` }}
              onClick={() => setSelected(agent)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{agent.type}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: ss.bg, color: ss.color }}>
                  {ss.label}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                {agent.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Events</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>{agent.eventsProcessed}</div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontSize: '0.9rem', color: ss.color, fontWeight: 600, marginTop: 2 }}>{ss.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Agent Runs */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="section-head"><h2>Recent Agent Activity Log</h2></div>
        <div style={{ maxHeight: 300, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Agent</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Event ID</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Result</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.run_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>
                    {AGENT_ICONS[r.agent_name.replace('_agent', '')] || '🤖'} {r.agent_name}
                  </td>
                  <td style={{ padding: '6px 10px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.trigger_event_id}</td>
                  <td style={{ padding: '6px 10px' }}>
                    {r.result?.is_suspicious !== undefined ? (
                      <span style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                        background: r.result.is_suspicious ? 'rgba(255,59,107,0.1)' : 'rgba(0,229,176,0.1)',
                        color: r.result.is_suspicious ? 'var(--critical)' : 'var(--teal)',
                      }}>
                        {r.result.is_suspicious ? '⚠ SUSPICIOUS' : '✓ CLEAN'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>processed</span>
                    )}
                  </td>
                  <td style={{ padding: '6px 10px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
              No agent runs yet. Start telemetry replay to activate agents.
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelected(null)}
        >
          <div className="card" style={{ width: 560, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                  {AGENT_ICONS[selected.type] || '🤖'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selected.name}</h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selected.type}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{selected.description}</p>

            {/* Agent-specific runs */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Recent Runs</div>
              {runs.filter(r => r.agent_name === `${selected.type}_agent`).slice(0, 5).map(r => (
                <div key={r.run_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.trigger_event_id}</span>
                  <span style={{ color: r.result?.is_suspicious ? 'var(--critical)' : 'var(--teal)' }}>
                    {r.result?.is_suspicious ? '⚠ Suspicious' : '✓ Clean'}
                  </span>
                </div>
              ))}
              {runs.filter(r => r.agent_name === `${selected.type}_agent`).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No runs for this agent yet.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;
