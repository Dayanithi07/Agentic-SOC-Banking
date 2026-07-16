import React from 'react';
import type { TelemetryEvent } from '../types';

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--critical)', high: 'var(--high)',
  medium: 'var(--medium)', low: 'var(--low)', info: 'var(--info)',
};

interface Props { event: TelemetryEvent; onClose: () => void; }

export const EventDetail: React.FC<Props> = ({ event, onClose }) => {
  const col = SEV_COLOR[event.severity] ?? 'var(--info)';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, animation: 'fade-up 0.2s ease',
      }}
    >
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{ width: 560, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span className={`badge badge--${event.severity}`}>{event.severity}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {event.id}
              </span>
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {event.event_type}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Risk Score Bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI Risk Score</span>
            <span style={{ fontWeight: 700, color: col, fontSize: '1.1rem' }}>
              {event.risk_score} / 100
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${event.risk_score}%`, background: col,
              borderRadius: 4, transition: 'width 0.8s ease',
              boxShadow: `0 0 12px ${col}80`,
            }} />
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            ['Source',  event.source],
            ['User',    event.user ?? '—'],
            ['Status',  event.status],
            ['Time',    new Date(event.timestamp).toLocaleString('en-IN')],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: 4, fontWeight: 500 }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Event Description
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {event.description}
          </p>
        </div>

        {/* AI Explanation */}
        {event.ai_explanation && (
          <div style={{
            background: 'var(--cyan-dim)', border: '1px solid var(--border-active)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span>🤖</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI Analysis
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {event.ai_explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onClose}>Dismiss</button>
          <button className="btn btn--primary">Investigate &rarr;</button>
        </div>
      </div>
    </div>
  );
};
