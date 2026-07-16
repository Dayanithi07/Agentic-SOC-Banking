import React, { useState } from 'react';
import { generateEvents } from '../hooks/useApi';

const events = generateEvents(100);

function countBy<K extends string>(arr: typeof events, key: (e: typeof events[0]) => K): Record<string, number> {
  const out: Record<string, number> = {};
  arr.forEach(e => { const k = key(e); out[k] = (out[k] ?? 0) + 1; });
  return out;
}

const bySev    = countBy(events, e => e.severity);
const bySource = countBy(events, e => e.source);
const byType   = countBy(events, e => e.event_type);

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
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, width: 28, textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  );
}

export const Analytics: React.FC = () => {
  const avgRisk = Math.round(events.reduce((s, e) => s + e.risk_score, 0) / events.length);
  const critPct = Math.round((bySev['critical'] ?? 0) / events.length * 100);

  // Hourly distribution (last 12h)
  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = new Date(); h.setHours(h.getHours() - (11 - i), 0, 0, 0);
    const hr = h.getHours();
    return { label: h.toLocaleTimeString('en-IN', { hour: '2-digit' }), count: events.filter(e => new Date(e.timestamp).getHours() === hr).length };
  });
  const maxH = Math.max(1, ...hours.map(h => h.count));

  const maxSrc  = Math.max(1, ...Object.values(bySource));
  const maxType = Math.max(1, ...Object.values(byType));

  return (
    <div className="main-content">
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>📊 Security Analytics</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Threat intelligence and trend analysis across all security data sources
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        <div className="stat-card"><span className="stat-card__label">Events Analysed</span><span className="stat-card__value">{events.length}</span><span className="stat-card__sub">Last 24 hours</span></div>
        <div className="stat-card"><span className="stat-card__label">Avg Risk Score</span><span className="stat-card__value" style={{ color: avgRisk >= 70 ? 'var(--critical)' : avgRisk >= 50 ? 'var(--high)' : 'var(--medium)' }}>{avgRisk}</span><span className="stat-card__sub">/ 100</span></div>
        <div className="stat-card"><span className="stat-card__label">Critical Rate</span><span className="stat-card__value" style={{ color: 'var(--critical)' }}>{critPct}%</span><span className="stat-card__sub">Of all events</span></div>
        <div className="stat-card"><span className="stat-card__label">Data Sources</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{Object.keys(bySource).length}</span><span className="stat-card__sub">Active connectors</span></div>
      </div>

      <div className="grid-2">
        {/* Hourly Trend Chart */}
        <div className="card">
          <div className="section-head"><h2>Event Volume (12-Hour Trend)</h2></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '0 4px' }}>
            {hours.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '80%', borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(180deg, var(--cyan), var(--indigo))',
                    height: `${Math.max((h.count / maxH) * 120, h.count > 0 ? 6 : 2)}px`,
                    transition: 'height 0.6s ease',
                    boxShadow: h.count > 0 ? '0 0 8px var(--cyan-glow)' : 'none',
                  }}
                />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Donut-style */}
        <div className="card">
          <div className="section-head"><h2>Severity Distribution</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(['critical', 'high', 'medium', 'low'] as const).map(s => (
              <HBar key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} count={bySev[s] ?? 0} max={events.length} color={SEV_COLORS[s]} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* By Source */}
        <div className="card">
          <div className="section-head"><h2>Events by Source</h2></div>
          {Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([src, cnt], i) => (
            <HBar key={src} label={src} count={cnt} max={maxSrc} color={PALETTE[i % PALETTE.length]} />
          ))}
        </div>

        {/* By Type */}
        <div className="card">
          <div className="section-head"><h2>Top Threat Types</h2></div>
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, cnt], i) => (
            <HBar key={t} label={t} count={cnt} max={maxType} color={PALETTE[i % PALETTE.length]} />
          ))}
        </div>
      </div>

      {/* Risk Score Distribution */}
      <div className="card">
        <div className="section-head"><h2>Risk Score Distribution</h2></div>
        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 80 }}>
          {Array.from({ length: 20 }, (_, i) => {
            const lo = i * 5, hi = lo + 5;
            const cnt = events.filter(e => e.risk_score >= lo && e.risk_score < hi).length;
            const maxCnt = Math.max(1, ...Array.from({ length: 20 }, (_, j) => events.filter(e => e.risk_score >= j * 5 && e.risk_score < j * 5 + 5).length));
            const col = lo >= 80 ? 'var(--critical)' : lo >= 60 ? 'var(--high)' : lo >= 40 ? 'var(--medium)' : 'var(--low)';
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }} title={`${lo}-${hi}: ${cnt} events`}>
                <div style={{ width: '80%', height: `${Math.max((cnt / maxCnt) * 70, cnt > 0 ? 4 : 1)}px`, background: col, borderRadius: '2px 2px 0 0', transition: 'height 0.6s ease' }} />
                {i % 4 === 0 && <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{lo}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
          <span>Low Risk (0-40)</span><span>Medium (40-60)</span><span>High (60-80)</span><span>Critical (80-100)</span>
        </div>
      </div>
    </div>
  );
};
