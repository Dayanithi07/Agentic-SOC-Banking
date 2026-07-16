import React from 'react';

interface Props { score: number; size?: number; }

export const RiskMeter: React.FC<Props> = ({ score, size = 120 }) => {
  const r    = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color =
    score >= 80 ? 'var(--critical)' :
    score >= 60 ? 'var(--high)'     :
    score >= 40 ? 'var(--medium)'   :
                  'var(--low)';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Risk
        </span>
      </div>
    </div>
  );
};
