import React, { useState, useEffect } from 'react';
import type { TelemetryEvent } from '../types';
import { generateEvents } from '../hooks/useApi';
import { EventDetail } from '../components/EventDetail';

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export const LiveAlerts: React.FC = () => {
  const [events,   setEvents]   = useState<TelemetryEvent[]>(() => generateEvents(40));
  const [filter,   setFilter]   = useState<string>('all');
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<TelemetryEvent | null>(null);
  const [sortBy,   setSortBy]   = useState<'time' | 'risk'>('time');

  // Live updates every 10 s
  useEffect(() => {
    const id = setInterval(() => {
      setEvents(prev => {
        const [e] = generateEvents(1);
        return [e, ...prev].slice(0, 200);
      });
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const filtered = events
    .filter(e => filter === 'all' || e.severity === filter)
    .filter(e =>
      !search ||
      e.event_type.toLowerCase().includes(search.toLowerCase()) ||
      (e.user ?? '').toLowerCase().includes(search.toLowerCase()) ||
      e.source.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === 'risk'
        ? b.risk_score - a.risk_score
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  const counts = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>;
  events.forEach(e => { if (counts[e.severity] !== undefined) counts[e.severity]++; });

  const sevColor: Record<string, string> = {
    critical: 'var(--critical)', high: 'var(--high)',
    medium: 'var(--medium)',   low: 'var(--low)', info: 'var(--info)',
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ⚡ Live Alerts
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time security alerts from all monitored sources
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)', animation: 'pulse-ring 2s infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--teal)' }}>LIVE</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
          <div
            key={sev}
            className="stat-card"
            style={{ borderColor: `${sevColor[sev]}40`, cursor: 'pointer', border: filter === sev ? `1px solid ${sevColor[sev]}` : undefined }}
            onClick={() => setFilter(filter === sev ? 'all' : sev)}
          >
            <span className="stat-card__label">{sev.toUpperCase()} ALERTS</span>
            <span className="stat-card__value" style={{ color: sevColor[sev] }}>{counts[sev]}</span>
            <span className="stat-card__sub">{filter === sev ? 'Click to clear filter' : 'Click to filter'}</span>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'critical', 'high', 'medium', 'low'].map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn--primary' : 'btn--ghost'}`}
                style={{ padding: '4px 12px', fontSize: '0.75rem', textTransform: 'capitalize' }}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f}
                {f !== 'all' && <span style={{ marginLeft: 4, opacity: 0.7 }}>({counts[f] ?? 0})</span>}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', outline: 'none' }}
              placeholder="Search by event type, user, source..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={`btn ${sortBy === 'time' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
              onClick={() => setSortBy('time')}
            >
              ⏱ Time
            </button>
            <button
              className={`btn ${sortBy === 'risk' ? 'btn--primary' : 'btn--ghost'}`}
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}
              onClick={() => setSortBy('risk')}
            >
              🎯 Risk
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 100px 80px 80px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          {['Severity', 'Event', 'Source', 'User', 'Risk', 'Time'].map(h => (
            <span key={h} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No alerts match your current filters.
            </div>
          )}
          {filtered.map((ev, i) => {
            const col = sevColor[ev.severity] ?? 'var(--info)';
            return (
              <div
                key={ev.id}
                onClick={() => setSelected(ev)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 120px 100px 80px 80px',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  animation: `fade-up 0.3s ease ${i < 10 ? i * 30 : 0}ms both`,
                  background: i === 0 && ev.status === 'new' ? `${col}08` : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = i === 0 && ev.status === 'new' ? `${col}08` : 'transparent')}
              >
                <span className={`badge badge--${ev.severity}`} style={{ justifySelf: 'start', alignSelf: 'center' }}>
                  {ev.severity}
                </span>
                <div style={{ alignSelf: 'center', minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.event_type}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.description}
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>{ev.source}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center', fontFamily: 'var(--font-mono)' }}>
                  {ev.user ?? '—'}
                </span>
                <span style={{ fontWeight: 700, color: col, alignSelf: 'center', fontSize: '0.95rem' }}>{ev.risk_score}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  {new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Showing {filtered.length} of {events.length} alerts &bull; Auto-refreshes every 10 seconds
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
