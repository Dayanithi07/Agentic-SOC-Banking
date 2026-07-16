import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { TelemetryEvent } from '../types';
import { StatCard }        from '../components/StatCard';
import { EventTimeline }   from '../components/EventTimeline';
import { TelemetryChart }  from '../components/TelemetryChart';
import { AgentChat }       from '../components/AgentChat';
import { RiskMeter }       from '../components/RiskMeter';
import { EventDetail }     from '../components/EventDetail';
import { generateEvents, generateStats, fetchRunCycle } from '../hooks/useApi';

const WS_URL = 'ws://localhost:8000/ws/telemetry';

export const Dashboard: React.FC = () => {
  const [events,   setEvents]   = useState<TelemetryEvent[]>(() => generateEvents(24));
  const [running,  setRunning]  = useState(false);
  const [selected, setSelected] = useState<TelemetryEvent | null>(null);
  const [tab,      setTab]      = useState<'timeline' | 'chart'>('timeline');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'live' | 'demo'>('demo');

  // Use a ref so cleanup can always see the latest socket
  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef     = useRef(true);  // guard against unmounted state updates

  const stats = generateStats(events);

  // ─── Safe WebSocket connect ──────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Cancel any pending reconnect timer
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }

    // Close existing socket cleanly before creating a new one
    if (wsRef.current) {
      const prev = wsRef.current;
      wsRef.current = null;
      // Only close if not already closed
      if (prev.readyState !== WebSocket.CLOSED &&
          prev.readyState !== WebSocket.CLOSING) {
        prev.close();
      }
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        setWsStatus('live');
      };

      ws.onmessage = (msg) => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        try {
          const ev = JSON.parse(msg.data) as TelemetryEvent;
          setEvents(prev => [ev, ...prev].slice(0, 200));
        } catch { /* ignore malformed */ }
      };

      ws.onerror = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        setWsStatus('demo');
      };

      ws.onclose = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        setWsStatus('demo');
        // Schedule reconnect only when component is still mounted
        reconnectRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 10_000);
      };
    } catch {
      setWsStatus('demo');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;

    // Small delay before first connect — avoids React StrictMode double-invoke race
    const initTimer = setTimeout(connect, 500);

    // Fallback mock event every 12 s (used when WS not available)
    const mockTimer = setInterval(() => {
      if (mountedRef.current && wsStatus !== 'live') {
        const [ev] = generateEvents(1);
        setEvents(prev => [ev, ...prev].slice(0, 200));
      }
    }, 12_000);

    return () => {
      mountedRef.current = false;

      clearTimeout(initTimer);
      clearInterval(mockTimer);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);

      // Close socket only if it's still open / connecting
      const ws = wsRef.current;
      if (ws && ws.readyState !== WebSocket.CLOSED &&
                ws.readyState !== WebSocket.CLOSING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Manual detection cycle ──────────────────────────────────────────────
  const runCycle = useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      const { events: newEvts } = await fetchRunCycle();
      if (mountedRef.current) {
        setEvents(prev => [...newEvts, ...prev].slice(0, 200));
      }
    } finally {
      if (mountedRef.current) setRunning(false);
    }
  }, [running]);

  const criticalEvents = events.filter(e => e.severity === 'critical');
  const wsColor = wsStatus === 'live'
    ? 'var(--teal)' : wsStatus === 'connecting'
    ? 'var(--medium)' : 'var(--text-muted)';
  const wsLabel = wsStatus === 'live'
    ? 'LIVE' : wsStatus === 'connecting'
    ? 'CONNECTING...' : 'DEMO MODE';

  return (
    <div className="main-content">

      {/* ── Header Row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Security Operations Center
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time threat monitoring &bull; FinSpark&apos;26 Banking Demo
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: wsColor, boxShadow: `0 0 6px ${wsColor}` }} />
          <span style={{ fontSize: '0.72rem', color: wsColor, fontWeight: 600 }}>{wsLabel}</span>
          <button
            className="btn btn--primary"
            onClick={runCycle}
            disabled={running}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            {running ? '⟳ Running...' : '▶ Run Cycle'}
          </button>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid-4">
        <StatCard label="Total Events"     value={stats.total_events}     sub="All sources"     icon="📋" animDelay={0}   />
        <StatCard label="Critical Alerts"  value={stats.critical_alerts}  sub="Requires action" icon="🔴" color="var(--critical)" animDelay={80}  />
        <StatCard label="Active AI Agents" value={stats.active_agents}    sub="Monitoring now"  icon="🤖" color="var(--teal)"     animDelay={160} />
        <StatCard label="Threats Resolved" value={stats.threats_resolved} sub="Last 24 hours"   icon="✅" color="var(--low)"      animDelay={240} />
      </div>

      {/* ── Risk + Severity ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '1.5rem', minWidth: 180 }}>
          <RiskMeter score={stats.avg_risk_score} size={140} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Risk Score</span>
          <button className="btn btn--ghost" onClick={runCycle} disabled={running} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
            {running ? '⟳' : '▶ Run Cycle'}
          </button>
        </div>

        <StatCard label="Events (Last Hour)" value={stats.events_last_hour} sub="Real-time monitor" icon="⏱️" color="var(--indigo)" />

        <div className="card">
          <div className="section-head"><h2>Severity Breakdown</h2></div>
          {[
            { sev: 'critical', label: 'Critical', color: 'var(--critical)' },
            { sev: 'high',     label: 'High',     color: 'var(--high)'     },
            { sev: 'medium',   label: 'Medium',   color: 'var(--medium)'   },
            { sev: 'low',      label: 'Low',       color: 'var(--low)'     },
          ].map(s => {
            const cnt = events.filter(e => e.severity === s.sev).length;
            const pct = events.length ? (cnt / events.length) * 100 : 0;
            return (
              <div key={s.sev} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: s.color, width: 24, textAlign: 'right' }}>{cnt}</span>
                <div style={{ flex: 2, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Feed + Chat ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>
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

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)', animation: 'pulse-ring 2s infinite' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>SOC AI Copilot</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Gemini 1.5 Flash</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AgentChat />
          </div>
        </div>
      </div>

      {/* ── Critical Alerts Banner ───────────────────────────────────────── */}
      {criticalEvents.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(255,59,107,0.35)', background: 'rgba(255,59,107,0.04)' }}>
          <div className="section-head">
            <h2 style={{ color: 'var(--critical)' }}>
              🔴 Critical Alerts &mdash; {criticalEvents.length} Active
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to investigate</span>
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
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              >
                <span>&#9888;</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ev.event_type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.source} &bull; {ev.user ?? 'unknown'}</div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--critical)', fontSize: '1.1rem' }}>{ev.risk_score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default Dashboard;
