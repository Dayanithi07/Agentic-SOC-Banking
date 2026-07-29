import React, { useState, useEffect } from 'react';
import { MitreMatrix } from '../components/MitreMatrix';

const API = 'http://localhost:8000';

const SEV_COLORS: Record<string, string> = {
  critical: 'var(--critical)', high: 'var(--high)',
  medium: 'var(--medium)', low: 'var(--low)', info: 'var(--info)',
};
const PALETTE = ['var(--cyan)', 'var(--indigo)', 'var(--teal)', 'var(--medium)', 'var(--high)', 'var(--critical)'];

function HBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: 160, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, width: 36, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  );
}

export const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topEndpoints, setTopEndpoints] = useState<any[]>([]);
  const [mitre, setMitre] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, trRes, usRes, epRes, mtRes, srcRes] = await Promise.all([
          fetch(`${API}/api/analytics/overview`),
          fetch(`${API}/api/analytics/severity-trend`),
          fetch(`${API}/api/analytics/top-users`),
          fetch(`${API}/api/analytics/top-endpoints`),
          fetch(`${API}/api/analytics/mitre-coverage`),
          fetch(`${API}/api/analytics/event-sources`),
        ]);
        if (ovRes.ok) setOverview(await ovRes.json());
        if (trRes.ok) setTrend(await trRes.json());
        if (usRes.ok) setTopUsers(await usRes.json());
        if (epRes.ok) setTopEndpoints(await epRes.json());
        if (mtRes.ok) setMitre(await mtRes.json());
        if (srcRes.ok) setSources(await srcRes.json());
      } catch (e) { console.error(e); }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const sevCounts = overview?.severity_counts || {};
  const maxSev = Math.max(1, ...Object.values(sevCounts).map(Number));
  const maxSrc = Math.max(1, ...sources.map((s: any) => s.count));
  const maxEp = Math.max(1, ...topEndpoints.map((e: any) => e.event_count));
  const maxUsr = Math.max(1, ...topUsers.map((u: any) => u.event_count));

  // Build hourly trend bars
  const trendMax = Math.max(1, ...trend.map((t: any) => (t.critical || 0) + (t.high || 0) + (t.medium || 0) + (t.low || 0) + (t.info || 0)));

  return (
    <div className="main-content">
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>📊 Security Analytics</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Real-time threat intelligence from database — auto-refreshes every 8 seconds
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        <div className="stat-card"><span className="stat-card__label">Events Analysed</span><span className="stat-card__value">{overview?.total_events ?? '—'}</span><span className="stat-card__sub">All time</span></div>
        <div className="stat-card"><span className="stat-card__label">Avg Risk Score</span><span className="stat-card__value" style={{ color: (overview?.avg_risk_score ?? 0) >= 70 ? 'var(--critical)' : 'var(--medium)' }}>{overview?.avg_risk_score ?? '—'}</span><span className="stat-card__sub">/ 100</span></div>
        <div className="stat-card"><span className="stat-card__label">Open Incidents</span><span className="stat-card__value" style={{ color: 'var(--critical)' }}>{overview?.open_incidents ?? '—'}</span><span className="stat-card__sub">Require attention</span></div>
        <div className="stat-card"><span className="stat-card__label">Agent Runs</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{overview?.total_agent_runs ?? '—'}</span><span className="stat-card__sub">Total processed</span></div>
      </div>

      <div className="grid-2">
        {/* Severity Trend */}
        <div className="card">
          <div className="section-head"><h2>Severity Trend (Hourly)</h2></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, padding: '0 4px' }}>
            {trend.slice(-12).map((t: any, i: number) => {
              const total = (t.critical || 0) + (t.high || 0) + (t.medium || 0) + (t.low || 0) + (t.info || 0);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }} title={`${t.hour}: ${total} events`}>
                  <div style={{
                    width: '80%', borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(180deg, var(--cyan), var(--indigo))',
                    height: `${Math.max((total / trendMax) * 120, total > 0 ? 6 : 2)}px`,
                    transition: 'height 0.6s ease',
                    boxShadow: total > 0 ? '0 0 8px var(--cyan-glow)' : 'none',
                  }} />
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{(t.hour || '').slice(-5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <div className="section-head"><h2>Severity Distribution</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(['critical', 'high', 'medium', 'low', 'info'] as const).map(s => (
              <HBar key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} count={sevCounts[s] ?? 0} max={maxSev} color={SEV_COLORS[s]} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Event Sources */}
        <div className="card">
          <div className="section-head"><h2>Events by Source</h2></div>
          {sources.map((s: any, i: number) => (
            <HBar key={s.source} label={s.source} count={s.count} max={maxSrc} color={PALETTE[i % PALETTE.length]} />
          ))}
          {sources.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No data yet</div>}
        </div>

        {/* Top Endpoints */}
        <div className="card">
          <div className="section-head"><h2>Top Targeted Endpoints</h2></div>
          {topEndpoints.map((ep: any, i: number) => (
            <HBar key={ep.endpoint} label={ep.endpoint} count={ep.event_count} max={maxEp} color={PALETTE[i % PALETTE.length]} />
          ))}
          {topEndpoints.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No data yet</div>}
        </div>
      </div>

      <div className="grid-2">
        {/* Top Users */}
        <div className="card">
          <div className="section-head"><h2>Most Active Users</h2></div>
          {topUsers.map((u: any, i: number) => (
            <HBar key={u.user_id} label={u.user_id} count={u.event_count} max={maxUsr} color={PALETTE[i % PALETTE.length]} />
          ))}
          {topUsers.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No data yet</div>}
        </div>

        {/* Placeholder for Risk Distribution */}
        <div className="card">
          <div className="section-head"><h2>Incident Status Overview</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
            <HBar label="Total Incidents" count={overview?.total_incidents ?? 0} max={Math.max(1, overview?.total_incidents ?? 1)} color="var(--cyan)" />
            <HBar label="Open" count={overview?.open_incidents ?? 0} max={Math.max(1, overview?.total_incidents ?? 1)} color="var(--critical)" />
            <HBar label="Resolved" count={(overview?.total_incidents ?? 0) - (overview?.open_incidents ?? 0)} max={Math.max(1, overview?.total_incidents ?? 1)} color="var(--teal)" />
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Coverage */}
      <div className="card" style={{ marginTop: 0 }}>
        <div className="section-head"><h2>MITRE ATT&CK Coverage</h2></div>
        <MitreMatrix data={mitre} />
      </div>
    </div>
  );
};

export default Analytics;
