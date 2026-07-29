import React from 'react';

interface NavItem { icon: string; label: string; id: string; badge?: number; }

const NAV: NavItem[] = [
  { icon: '🛡️', label: 'Dashboard',      id: 'dashboard' },
  { icon: '⚡',  label: 'Live Alerts',    id: 'alerts'   },
  { icon: '🔍', label: 'Threat Hunt',    id: 'hunt'     },
  { icon: '🤖', label: 'AI Agents',      id: 'agents'   },
  { icon: '📊', label: 'Analytics',      id: 'analytics'},
  { icon: '📋', label: 'Investigations', id: 'investigations' },
  { icon: '🛡️', label: 'Vulnerabilities',id: 'vulnerabilities'},
];
const BOTTOM: NavItem[] = [
  { icon: '⚙️', label: 'Settings', id: 'settings' },
  { icon: '❓', label: 'Help',     id: 'help'     },
];

const SYSTEM = [
  { label: 'Backend API',  ok: true },
  { label: 'Agent Engine', ok: true },
  { label: 'Data Stream',  ok: true },
];

interface Props { active: string; onNav: (id: string) => void; criticalCount: number; }

export const Sidebar: React.FC<Props> = ({ active, onNav, criticalCount }) => (
  <aside className="sidebar">
    <nav className="sidebar__nav">
      <p className="sidebar__section-label">Navigation</p>

      {NAV.map(n => (
        <div
          key={n.id}
          className={`sidebar__item${active === n.id ? ' sidebar__item--active' : ''}`}
          onClick={() => onNav(n.id)}
        >
          <span className="sidebar__icon">{n.icon}</span>
          <span style={{ flex: 1 }}>{n.label}</span>
          {n.id === 'alerts' && criticalCount > 0 && (
            <span style={{ background: 'var(--critical)', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>
              {criticalCount}
            </span>
          )}
        </div>
      ))}

      <div className="sidebar__divider" />
      <p className="sidebar__section-label">System</p>

      {BOTTOM.map(n => (
        <div
          key={n.id}
          className={`sidebar__item${active === n.id ? ' sidebar__item--active' : ''}`}
          onClick={() => onNav(n.id)}
        >
          <span className="sidebar__icon">{n.icon}</span>
          {n.label}
        </div>
      ))}
    </nav>

    {/* System status */}
    <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        System Status
      </div>
      {SYSTEM.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.ok ? 'var(--teal)' : 'var(--critical)', boxShadow: `0 0 5px ${s.ok ? 'var(--teal)' : 'var(--critical)'}` }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{s.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: s.ok ? 'var(--teal)' : 'var(--critical)' }}>
            {s.ok ? 'ONLINE' : 'ERROR'}
          </span>
        </div>
      ))}
    </div>
  </aside>
);
