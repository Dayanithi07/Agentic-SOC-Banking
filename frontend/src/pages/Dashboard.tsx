import React, { useState, useEffect, useCallback } from 'react';
import type { TelemetryEvent } from '../types';
import { StatCard }        from '../components/StatCard';
import { EventTimeline }   from '../components/EventTimeline';
import { TelemetryChart }  from '../components/TelemetryChart';
import { AgentChat }       from '../components/AgentChat';
import { RiskMeter }       from '../components/RiskMeter';
import { EventDetail }     from '../components/EventDetail';
import { generateEvents, generateStats, fetchRunCycle } from '../hooks/useApi';

export const Dashboard: React.FC = () => {
  const [events,   setEvents]   = useState<TelemetryEvent[]>(() => generateEvents(24));
  const [running,  setRunning]  = useState(false);
  const [selected, setSelected] = useState<TelemetryEvent | null>(null);
  const [tab,      setTab]      = useState<'timeline' | 'chart'>('timeline');

  const stats = generateStats(events);

  // Live simulation — add a new event every 12 s
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents(prev => {
        const [newEv] = generateEvents(1);
        return [newEv, ...prev].slice(0, 200);
      });
    }, 12_000);
    return () => clearInterval(timer);
  }, []);

  const runCycle = useCallback(async () => {
    setRunning(true);
    try {
      const { events: newEvts } = await fetchRunCycle();
      setEvents(prev => [...newEvts, ...prev].slice(0, 200));
    } finally {
      setRunning(false);
    }
  }, []);

  const criticalEvents = events.filter(e => e.severity === 'critical');

  return (
    <div className="main-content">

      {/* ── KPI Row ────────────────────────────────────────────────── */}
      <div className="grid-4">
        <StatCard label="Total Events"      value={stats.total_events}     sub="All sources"       icon="📋" animDelay={0}   />
        <StatCard label="Critical Alerts"   value={stats.critical_alerts}  sub="Requires action"   icon="🔴" color="var(--critical)" animDelay={80}  />
        <StatCard label="Active AI Agents"  value={stats.active_agents}    sub="Monitoring now"    icon="🤖" color="var(--teal)"     animDelay={160} />
        <StatCard label="Threats Resolved"  value={stats.threats_resolved} sub="Last 24 hours"     icon="✅" color="var(--low)"      animDelay={240} />
      </div>

      {/* ── Risk + Stats Row ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>

        {/* Risk Gauge */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '1.5rem' }}>
          <RiskMeter score={stats.avg_risk_score} size={140} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Risk Score</span>
          <button className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: '5px 12px' }} onClick={runCycle} disabled={running}>
            {running ? '⟳ Scanning…' : '▶ Run Cycle'}
          </button>
        </div>

        {/* Events last hour */}
        <StatCard
          label="Events (Last Hour)"
          value={stats.events_last_hour}
          sub="Real-time monitor"
          icon="⏱️"
          color="var(--indigo)"
        />

        {/* Severity breakdown */}
        <div className="card">
          <div className="section-head"><h2>Severity Breakdown</h2></div>
          {[
            { label: 'Critical', sev: 'critical', color: 'var(--critical)' },
            { label: 'High',     sev: 'high',     color: 'var(--high)'     },
            { label: 'Medium',   sev: 'medium',   color: 'var(--medium)'   },
            { label: 'Low',      sev: 'low',      color: 'var(--low)'      },
          ].map(s => {
            const cnt = events.filter(e => e.severity === s.sev).length;
            const pct = events.length ? (cnt / events.length) * 100 : 0;
            return (
              <div key={s.sev} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: s.color }}>{cnt}</span>
                <div style={{ flex: 2, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Feed + Chat ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>

        {/* Event Timeline / Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <div className="section-head">
            <h2>Security Event Feed</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['timeline', 'chart'] as const).map(t => (
                <button
                  key={t}
                  className={`btn ${tab === t ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  onClick={() => setTab(t)}
                >
                  {t === 'timeline' ? '📋 Timeline' : '📊 Chart'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {tab === 'timeline'
              ? <EventTimeline events={events.slice(0, 50)} onSelect={setSelected} />
              : <TelemetryChart events={events} />
            }
          </div>
        </div>

        {/* AI Copilot Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)', animation: 'pulse-ring 2s infinite' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>SOC AI Copilot</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AgentChat />
          </div>
        </div>
      </div>

      {/* ── Critical Alerts Banner ─────────────────────────────────── */}
      {criticalEvents.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(255,59,107,0.35)', background: 'rgba(255,59,107,0.04)' }}>
          <div className="section-head">
            <h2 style={{ color: 'var(--critical)' }}>
              🔴 Critical Alerts &mdash; {criticalEvents.length} Active
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click any alert to investigate</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {criticalEvents.slice(0, 5).map(ev => (
              <div
                key={ev.id}
                onClick={() => setSelected(ev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'var(--bg-secondary)',
                  borderRadius: 8, border: '1px solid rgba(255,59,107,0.25)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {ev.event_type}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ev.source} &bull; {ev.user ?? 'unknown'}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--critical)', fontSize: '1.1rem' }}>
                  {ev.risk_score}
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&rsaquo;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ─────────────────────────────────────── */}
      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default Dashboard;
