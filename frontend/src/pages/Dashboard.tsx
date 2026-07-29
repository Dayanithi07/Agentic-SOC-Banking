import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { TelemetryEvent } from '../types';
import { StatCard }        from '../components/StatCard';
import { EventTimeline }   from '../components/EventTimeline';
import { TelemetryChart }  from '../components/TelemetryChart';
import { AgentChat }       from '../components/AgentChat';
import { RiskMeter }       from '../components/RiskMeter';
import { EventDetail }     from '../components/EventDetail';

const WS_URL = 'ws://localhost:8000/ws/telemetry';
const API = 'http://localhost:8000';

interface LiveStats {
  total_events: number;
  critical_alerts: number;
  active_agents: number;
  open_incidents: number;
  avg_risk_score: number;
  events_last_hour: number;
  severity_counts: Record<string, number>;
}

function mapRawToEvent(raw: any): TelemetryEvent | null {
  if (!raw.event_type && !raw.event_id) return null;
  return {
    id: raw.event_id || raw.id || `ws-${Date.now()}`,
    source: raw.source || 'unknown',
    event_type: raw.event_type || 'unknown',
    severity: raw.severity || 'info',
    timestamp: raw.timestamp || new Date().toISOString(),
    user: raw.user_id || raw.user,
    description: raw.mitre_technique || raw.event_type || '',
    risk_score: raw.risk_score ?? (raw.severity === 'critical' ? 90 : raw.severity === 'high' ? 70 : raw.severity === 'medium' ? 45 : 20),
    ai_explanation: raw.mitre_tactic ? `${raw.mitre_tactic}: ${raw.mitre_technique || ''}` : undefined,
    status: 'new',
  };
}

export const Dashboard: React.FC = () => {
  const [events,   setEvents]   = useState<TelemetryEvent[]>([]);
  const [selected, setSelected] = useState<TelemetryEvent | null>(null);
  const [tab,      setTab]      = useState<'timeline' | 'chart'>('timeline');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'live' | 'offline'>('offline');

  // Live stats from backend API
  const [stats, setStats] = useState<LiveStats>({
    total_events: 0, critical_alerts: 0, active_agents: 9,
    open_incidents: 0, avg_risk_score: 0, events_last_hour: 0,
    severity_counts: {}
  });

  // Scenario replay state
  const [scenarios, setScenarios]             = useState<string[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [replayStatus, setReplayStatus]       = useState<'stopped' | 'running' | 'paused'>('stopped');
  const [replaySpeed, setReplaySpeed]         = useState(10);
  const [replayProgress, setReplayProgress]   = useState({ current: 0, total: 0 });

  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef   = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/api/replay/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setSelectedScenario(data.filename);
        // Refresh scenario list
        const listRes = await fetch(`${API}/api/replay/scenarios`);
        if (listRes.ok) {
          const d = await listRes.json();
          setScenarios(d.scenarios || []);
        }
      }
    } catch (err) { console.error(err); }
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Fetch scenarios from backend ─────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/replay/scenarios`)
      .then(r => r.json())
      .then(d => {
        setScenarios(d.scenarios || []);
        if (d.active_scenario) setSelectedScenario(d.active_scenario);
        else if (d.scenarios?.length) setSelectedScenario(d.scenarios[0]);
      })
      .catch(() => {});
  }, []);

  // ── Poll live stats from backend every 3s ────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const [analyticsRes, replayRes] = await Promise.all([
          fetch(`${API}/api/analytics/overview`),
          fetch(`${API}/api/replay/status`),
        ]);
        if (analyticsRes.ok) {
          const a = await analyticsRes.json();
          setStats(prev => ({
            ...prev,
            total_events: a.total_events ?? prev.total_events,
            critical_alerts: (a.severity_counts?.critical ?? 0) + (a.severity_counts?.high ?? 0),
            open_incidents: a.open_incidents ?? prev.open_incidents,
            avg_risk_score: a.avg_risk_score ?? prev.avg_risk_score,
            severity_counts: a.severity_counts ?? prev.severity_counts,
          }));
        }
        if (replayRes.ok) {
          const r = await replayRes.json();
          if (r.status === 'running') setReplayStatus('running');
          else if (r.status === 'paused') setReplayStatus('paused');
          else setReplayStatus('stopped');
          setReplayProgress({ current: r.current_index ?? 0, total: r.total_events ?? 0 });
        }
      } catch { /* backend offline */ }
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, []);

  // ── WebSocket ────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    if (wsRef.current) {
      const prev = wsRef.current; wsRef.current = null;
      if (prev.readyState < 2) prev.close();
    }
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => { if (mountedRef.current && wsRef.current === ws) setWsStatus('live'); };
      ws.onmessage = (msg) => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        try {
          const parsed = JSON.parse(msg.data);
          const raw = parsed.type === 'event' ? parsed.data : parsed;
          const ev = mapRawToEvent(raw);
          if (ev) setEvents(prev => [ev, ...prev].slice(0, 500));
        } catch {}
      };
      ws.onerror = () => { if (mountedRef.current && wsRef.current === ws) setWsStatus('offline'); };
      ws.onclose = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        setWsStatus('offline');
        reconnectRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, 5000);
      };
    } catch { setWsStatus('offline'); }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(connect, 300);
    return () => {
      mountedRef.current = false; clearTimeout(t);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      if (ws && ws.readyState < 2) ws.close();
      wsRef.current = null;
    };
  }, [connect]);

  // ── Replay actions ───────────────────────────────────────────────────
  const handleSelectScenario = async (filename: string) => {
    setSelectedScenario(filename);
    try {
      await fetch(`${API}/api/replay/select-scenario`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
    } catch {}
  };

  const handleStart = async () => {
    await fetch(`${API}/api/replay/select-scenario`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: selectedScenario }),
    }).catch(() => {});
    await fetch(`${API}/api/replay/start?mode=file`, { method: 'POST' }).catch(() => {});
    setReplayStatus('running');
  };

  const handlePause = async () => {
    await fetch(`${API}/api/replay/pause`, { method: 'POST' }).catch(() => {});
    setReplayStatus('paused');
  };

  const handleStop = async () => {
    await fetch(`${API}/api/replay/stop`, { method: 'POST' }).catch(() => {});
    setReplayStatus('stopped');
  };

  const handleSpeed = async (speed: number) => {
    setReplaySpeed(speed);
    await fetch(`${API}/api/replay/speed`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    }).catch(() => {});
  };

  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'high');
  const wsColor = wsStatus === 'live' ? 'var(--teal)' : 'var(--text-muted)';

  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  events.forEach(e => { if (e.severity in sevCounts) sevCounts[e.severity as keyof typeof sevCounts]++; });

  return (
    <div className="main-content">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Security Operations Center
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time AI threat detection &bull; Feed log files to analyse attacks
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: wsColor, boxShadow: `0 0 6px ${wsColor}` }} />
          <span style={{ fontSize: '0.72rem', color: wsColor, fontWeight: 600 }}>
            {wsStatus === 'live' ? '● CONNECTED' : '○ OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── Log File Feeder Panel ────────────────────────────────────── */}
      <div className="card" style={{
        marginBottom: 16,
        border: replayStatus === 'running' ? '1px solid var(--teal)' : '1px solid var(--border)',
        background: replayStatus === 'running' ? 'rgba(0, 229, 176, 0.04)' : 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>{replayStatus === 'running' ? '🔄' : '📁'}</span>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {replayStatus === 'running' ? 'Feeding & Analysing Logs...' : 'Log File Feeder'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {replayStatus === 'running'
                  ? `Processing ${replayProgress.current} / ${replayProgress.total} events from ${selectedScenario}`
                  : 'Select a .jsonl scenario file to feed into the AI detection pipeline'
                }
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jsonl,.json,.txt,application/json,text/plain,*/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {/* Upload button */}
            <button
              className="btn btn--ghost"
              style={{
                fontSize: '0.78rem', padding: '6px 12px',
                border: '1px dashed var(--cyan)', color: 'var(--cyan)',
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={replayStatus === 'running'}
            >
              📤 Upload .jsonl
            </button>

            {/* Scenario Dropdown */}
            <select
              value={selectedScenario}
              onChange={(e) => handleSelectScenario(e.target.value)}
              disabled={replayStatus === 'running'}
              style={{
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '6px 10px', fontSize: '0.78rem', cursor: 'pointer',
                opacity: replayStatus === 'running' ? 0.5 : 1,
              }}
            >
              {scenarios.map(s => <option key={s} value={s}>{s}</option>)}
              {scenarios.length === 0 && (
                <option value="">No scenarios found</option>
              )}
            </select>

            {/* Controls */}
            {replayStatus !== 'running' ? (
              <button
                className="btn btn--primary"
                style={{ fontSize: '0.8rem', padding: '8px 16px', fontWeight: 700 }}
                onClick={handleStart}
                disabled={!selectedScenario}
              >
                ▶ Feed Log File
              </button>
            ) : (
              <button className="btn btn--ghost" style={{ fontSize: '0.78rem', padding: '6px 12px' }} onClick={handlePause}>
                ⏸ Pause
              </button>
            )}

            {replayStatus === 'paused' && (
              <button className="btn btn--primary" style={{ fontSize: '0.78rem', padding: '6px 12px' }} onClick={handleStart}>
                ▶ Resume
              </button>
            )}

            {replayStatus !== 'stopped' && (
              <button className="btn btn--ghost" style={{ fontSize: '0.78rem', padding: '6px 12px', color: 'var(--critical)' }} onClick={handleStop}>
                ⏹ Stop
              </button>
            )}

            {/* Speed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-secondary)', borderRadius: 6, padding: '3px 8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Speed:</span>
              {[1, 5, 10, 50].map(spd => (
                <button
                  key={spd}
                  onClick={() => handleSpeed(spd)}
                  style={{
                    background: replaySpeed === spd ? 'var(--cyan)' : 'transparent',
                    color: replaySpeed === spd ? '#000' : 'var(--text-secondary)',
                    border: 'none', borderRadius: 4, padding: '3px 8px',
                    fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {replayStatus !== 'stopped' && replayProgress.total > 0 && (
          <div style={{ marginTop: 10, height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(replayProgress.current / replayProgress.total) * 100}%`,
              background: 'linear-gradient(90deg, var(--teal), var(--cyan))',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        )}
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────── */}
      <div className="grid-4">
        <StatCard label="Total Events"    value={events.length || stats.total_events} sub="From log feed" icon="📋" animDelay={0} />
        <StatCard label="Critical / High" value={criticalEvents.length} sub="Requires action" icon="🔴" color="var(--critical)" animDelay={80} />
        <StatCard label="Active AI Agents" value={9} sub="Monitoring now" icon="🤖" color="var(--teal)" animDelay={160} />
        <StatCard label="Open Incidents"  value={stats.open_incidents} sub="AI-generated" icon="🔍" color="var(--high)" animDelay={240} />
      </div>

      {/* ── Risk + Severity ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '1.5rem', minWidth: 180 }}>
          <RiskMeter score={stats.avg_risk_score} size={140} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Risk Score</span>
        </div>

        <StatCard label="Events In Feed" value={events.length} sub="Live WebSocket stream" icon="⏱️" color="var(--indigo)" />

        <div className="card">
          <div className="section-head"><h2>Severity Breakdown</h2></div>
          {[
            { sev: 'critical', label: 'Critical', color: 'var(--critical)' },
            { sev: 'high',     label: 'High',     color: 'var(--high)' },
            { sev: 'medium',   label: 'Medium',   color: 'var(--medium)' },
            { sev: 'low',      label: 'Low',      color: 'var(--low)' },
            { sev: 'info',     label: 'Info',      color: 'var(--text-muted)' },
          ].map(s => {
            const cnt = sevCounts[s.sev as keyof typeof sevCounts] || 0;
            const pct = events.length ? (cnt / events.length) * 100 : 0;
            return (
              <div key={s.sev} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: s.color, width: 28, textAlign: 'right' }}>{cnt}</span>
                <div style={{ flex: 2, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Feed + Chat ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <div className="section-head">
            <h2>Security Event Feed {events.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>({events.length} events)</span>}</h2>
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
            {events.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem' }}>📁</span>
                <span style={{ fontSize: '0.9rem' }}>No events yet</span>
                <span style={{ fontSize: '0.75rem' }}>Select a scenario file above and click <strong>"Feed Log File"</strong> to begin analysis</span>
              </div>
            ) : tab === 'timeline'
              ? <EventTimeline events={events.slice(0, 50)} onSelect={setSelected} />
              : <TelemetryChart events={events} />
            }
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 500, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)', animation: 'pulse-ring 2s infinite' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>SOC AI Copilot</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>Claude Opus 4.6</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AgentChat />
          </div>
        </div>
      </div>

      {/* ── Critical Alerts ──────────────────────────────────────────── */}
      {criticalEvents.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(255,59,107,0.35)', background: 'rgba(255,59,107,0.04)' }}>
          <div className="section-head">
            <h2 style={{ color: 'var(--critical)' }}>
              🔴 Critical & High Alerts &mdash; {criticalEvents.length} Detected
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to investigate</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {criticalEvents.slice(0, 8).map(ev => (
              <div
                key={ev.id}
                onClick={() => setSelected(ev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'var(--bg-secondary)',
                  borderRadius: 8, border: `1px solid ${ev.severity === 'critical' ? 'rgba(255,59,107,0.25)' : 'rgba(255,165,0,0.25)'}`,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              >
                <span style={{ fontSize: '1.1rem' }}>{ev.severity === 'critical' ? '🔴' : '🟠'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ev.event_type}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {ev.source} &bull; {ev.user ?? 'unknown'} &bull; {ev.description}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{
                    fontWeight: 700, fontSize: '0.75rem',
                    color: ev.severity === 'critical' ? 'var(--critical)' : 'var(--high)',
                    textTransform: 'uppercase',
                  }}>
                    {ev.severity}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
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
