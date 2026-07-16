import React from 'react';

interface Props { liveCount: number; onRunCycle: () => void; running: boolean; }

export const Header: React.FC<Props> = ({ liveCount, onRunCycle, running }) => (
  <header className="header">
    <div className="header__logo">
      <div className="header__logo-icon">🛡</div>
      <span>
        Agentic<span style={{ color: 'var(--cyan)' }}>SOC</span>
      </span>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>
        FinSpark &apos;26
      </span>
    </div>

    <div className="header__spacer" />

    <div className="header__search">
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
      <input placeholder="Search events, users, IPs..." />
    </div>

    <div className="header__actions">
      <div className="header__pill">
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', marginRight: 6, verticalAlign: 'middle', boxShadow: '0 0 5px var(--teal)' }} />
        Live &mdash; {liveCount} events
      </div>

      <button
        className="btn btn--primary"
        onClick={onRunCycle}
        disabled={running}
        style={{ fontSize: '0.8rem', padding: '7px 14px' }}
      >
        {running ? '⟳ Running...' : '▶ Run Detection Cycle'}
      </button>

      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--indigo), var(--cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '0.9rem',
      }}>
        👤
      </div>
    </div>
  </header>
);
