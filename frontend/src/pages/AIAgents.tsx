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
    id: '1', name: 'Assessment Agent', role: 'Vulnerability Analysis', icon: '🛡️', status: 'active',
    source: 'Application Scanner', eventsProcessed: 12, lastRun: '1m ago', avgResponseMs: 1500,
    capabilities: ['Static finding analysis', 'Vulnerability contextualization', 'Exploitability assessment'],
    description: 'Analyzes application assessment results and identifies security weaknesses.',
  },
  {
    id: '2', name: 'Investigation Agent', role: 'Runtime Correlation', icon: '🕵️', status: 'idle',
    source: 'Telemetry Replay', eventsProcessed: 4, lastRun: '5m ago', avgResponseMs: 3200,
    capabilities: ['Event correlation', 'Timeline analysis', 'Incident synthesis', 'Evidence extraction'],
    description: 'Investigates suspicious runtime behavior by correlating related security events and static findings.',
  },
  {
    id: '3', name: 'Coordinator Agent', role: 'Orchestrator', icon: '🧠', status: 'active',
    source: 'Internal pipeline', eventsProcessed: 154, lastRun: '2s ago', avgResponseMs: 450,
    capabilities: ['Agent routing', 'Decision making', 'Result aggregation'],
    description: 'Main controller that receives telemetry, determines if processing is required, and invokes the appropriate sub-agent.',
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
          SOCShield Autonomous security agents monitoring the E-Commerce platform
        </p>
      </div>

      <div className="grid-4">
        <div className="stat-card"><span className="stat-card__label">Total Agents</span><span className="stat-card__value">3</span></div>
        <div className="stat-card"><span className="stat-card__label">Active</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{AGENTS.filter(a => a.status === 'active').length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Findings Generated</span><span className="stat-card__value" style={{ color: 'var(--medium)' }}>2</span></div>
        <div className="stat-card"><span className="stat-card__label">Investigations</span><span className="stat-card__value">1</span></div>
      </div>

      <div className="grid-3" style={{ marginTop: '1rem' }}>
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
              <button className="btn btn--primary">View Logs</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgents;
