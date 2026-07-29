import React from 'react';

interface TimelineEvent {
  event_id: string;
  timestamp: string;
  event_type: string;
  severity: string;
  source: string;
  user_id?: string;
  ip_address?: string;
  endpoint?: string;
  mitre_tactic?: string;
  mitre_technique?: string;
}

interface Props {
  events: TimelineEvent[];
  title?: string;
}

const SEV_COLORS: Record<string, string> = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  medium: 'var(--medium)',
  low: 'var(--low)',
  info: 'var(--info)',
};

const SEV_ICONS: Record<string, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  info: '🔵',
};

export const AttackTimeline: React.FC<Props> = ({ events, title }) => {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        No events in timeline
      </div>
    );
  }

  return (
    <div>
      {title && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{title}</div>}
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 8, top: 4, bottom: 4, width: 2,
          background: 'linear-gradient(180deg, var(--cyan), var(--border))',
        }} />

        {events.map((evt, i) => {
          const color = SEV_COLORS[evt.severity] || 'var(--text-muted)';
          return (
            <div
              key={evt.event_id || i}
              className="anim-fade-up"
              style={{
                position: 'relative',
                marginBottom: 12,
                paddingLeft: 16,
                animationDelay: `${i * 40}ms`,
              }}
            >
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -20, top: 6,
                width: 12, height: 12, borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                border: '2px solid var(--bg-card)',
                zIndex: 1,
              }} />

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {SEV_ICONS[evt.severity] || '⚪'} {evt.event_type}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {evt.source && <span>📡 {evt.source}</span>}
                  {evt.user_id && <span>👤 {evt.user_id}</span>}
                  {evt.ip_address && <span>🌐 {evt.ip_address}</span>}
                  {evt.endpoint && <span>🔗 {evt.endpoint}</span>}
                </div>

                {evt.mitre_technique && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(99, 110, 240, 0.15)',
                      color: 'var(--indigo)',
                      border: '1px solid rgba(99, 110, 240, 0.3)',
                    }}>
                      {evt.mitre_technique}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttackTimeline;
