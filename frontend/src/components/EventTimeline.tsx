import React from 'react';
import type { TelemetryEvent } from '../types';

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--critical)',
  high:     'var(--high)',
  medium:   'var(--medium)',
  low:      'var(--low)',
  info:     'var(--info)',
};
const SEV_ICON: Record<string, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', info: '🔵',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface Props {
  events: TelemetryEvent[];
  onSelect?: (e: TelemetryEvent) => void;
}

export const EventTimeline: React.FC<Props> = ({ events, onSelect }) => {
  if (events.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No events yet. Run a detection cycle to populate the feed.
      </div>
    );
  }
  return (
    <div className="timeline">
      {events.map((ev, i) => {
        const col = SEV_COLOR[ev.severity] ?? 'var(--info)';
        return (
          <div
            key={ev.id}
            className="timeline-item"
            style={{ animationDelay: `${i * 40}ms`, cursor: 'pointer' }}
            onClick={() => onSelect?.(ev)}
          >
            <div
              className="timeline-item__icon"
              style={{ background: `${col}22`, border: `1px solid ${col}55` }}
            >
              {SEV_ICON[ev.severity] ?? '⚪'}
            </div>

            <div className="timeline-item__body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span className="timeline-item__title">{ev.event_type}</span>
                <span className={`badge badge--${ev.severity}`}>{ev.severity}</span>
              </div>
              <div className="timeline-item__meta">
                {fmtTime(ev.timestamp)} &bull; {ev.source}
                {ev.user ? ` • ${ev.user}` : ''}
              </div>
              <div className="timeline-item__desc">{ev.description}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 44 }}>
              <span style={{
                fontSize: '1.1rem', fontWeight: 700,
                color: ev.risk_score >= 80 ? 'var(--critical)'
                     : ev.risk_score >= 60 ? 'var(--high)'
                     : ev.risk_score >= 40 ? 'var(--medium)'
                     :                       'var(--low)',
              }}>
                {ev.risk_score}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>RISK</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
