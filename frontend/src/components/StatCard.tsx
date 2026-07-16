import React from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
  animDelay?: number;
}

export const StatCard: React.FC<Props> = ({ label, value, sub, color, icon, animDelay = 0 }) => (
  <div
    className="stat-card anim-fade-up"
    style={{ animationDelay: `${animDelay}ms`, borderColor: color ? `${color}40` : undefined }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span className="stat-card__label">{label}</span>
      {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
    </div>
    <div className="stat-card__value" style={{ color: color ?? 'var(--text-primary)' }}>
      {value}
    </div>
    {sub && <span className="stat-card__sub">{sub}</span>}
  </div>
);
