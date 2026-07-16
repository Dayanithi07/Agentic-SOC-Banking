import React from 'react';
import type { TelemetryEvent } from '../types';

interface Bucket {
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

function buildBuckets(events: TelemetryEvent[]): Bucket[] {
  return Array.from({ length: 12 }, (_, i) => {
    const h = new Date();
    h.setHours(h.getHours() - (11 - i), 0, 0, 0);
    const hr = h.getHours();
    return {
      label:    h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      critical: events.filter(e => e.severity === 'critical' && new Date(e.timestamp).getHours() === hr).length,
      high:     events.filter(e => e.severity === 'high'     && new Date(e.timestamp).getHours() === hr).length,
      medium:   events.filter(e => e.severity === 'medium'   && new Date(e.timestamp).getHours() === hr).length,
      low:      events.filter(e => e.severity === 'low'      && new Date(e.timestamp).getHours() === hr).length,
    };
  });
}

interface Props { events: TelemetryEvent[]; }

export const TelemetryChart: React.FC<Props> = ({ events }) => {
  const buckets = buildBuckets(events);
  const maxVal  = Math.max(1, ...buckets.map(b => b.critical + b.high + b.medium + b.low));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, padding: '0 4px' }}>
        {buckets.map((b, i) => {
          const total = b.critical + b.high + b.medium + b.low;
          const pct   = total / maxVal;
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}
              title={`${b.label}: ${total} events`}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', borderRadius: '3px 3px 0 0', overflow: 'hidden', height: `${Math.max(pct * 120, total > 0 ? 8 : 0)}px`, transition: 'height 0.6s ease', minHeight: total > 0 ? 8 : 2 }}>
                {b.critical > 0 && <div style={{ flex: b.critical, background: 'var(--critical)', minHeight: 2 }} />}
                {b.high     > 0 && <div style={{ flex: b.high,     background: 'var(--high)',     minHeight: 2 }} />}
                {b.medium   > 0 && <div style={{ flex: b.medium,   background: 'var(--medium)',   minHeight: 2 }} />}
                {b.low      > 0 && <div style={{ flex: b.low,      background: 'var(--low)',      minHeight: 2 }} />}
                {total === 0    && <div style={{ flex: 1, background: 'var(--bg-card-hover)' }} />}
              </div>
              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', transform: 'rotate(-30deg)', transformOrigin: 'top center' }}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          ['var(--critical)', 'Critical'],
          ['var(--high)',     'High'],
          ['var(--medium)',   'Medium'],
          ['var(--low)',      'Low'],
        ].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
