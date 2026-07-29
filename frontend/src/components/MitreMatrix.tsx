import React from 'react';

interface MitreEntry {
  tactic: string;
  technique: string;
  count: number;
}

interface Props {
  data: MitreEntry[];
}

const TACTIC_ORDER = [
  'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
  'Collection', 'Command and Control', 'Exfiltration', 'Impact',
];

const TACTIC_COLORS: Record<string, string> = {
  'Initial Access': '#e74c3c',
  'Execution': '#e67e22',
  'Persistence': '#f39c12',
  'Privilege Escalation': '#ff3b6b',
  'Defense Evasion': '#9b59b6',
  'Credential Access': '#3498db',
  'Discovery': '#1abc9c',
  'Lateral Movement': '#2ecc71',
  'Collection': '#e84393',
  'Command and Control': '#fd79a8',
  'Exfiltration': '#d63031',
  'Impact': '#6c5ce7',
};

export const MitreMatrix: React.FC<Props> = ({ data }) => {
  const grouped: Record<string, { technique: string; count: number }[]> = {};
  data.forEach(d => {
    if (!grouped[d.tactic]) grouped[d.tactic] = [];
    grouped[d.tactic].push({ technique: d.technique, count: d.count });
  });

  const maxCount = Math.max(1, ...data.map(d => d.count));
  const activeTactics = TACTIC_ORDER.filter(t => grouped[t] && grouped[t].length > 0);

  if (activeTactics.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No MITRE ATT&CK techniques detected yet. Start telemetry replay to generate data.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(activeTactics.length, 6)}, 1fr)`, gap: 8 }}>
      {activeTactics.map(tactic => (
        <div key={tactic} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            padding: '8px 10px',
            background: TACTIC_COLORS[tactic] || 'var(--cyan)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            textAlign: 'center',
          }}>
            {tactic}
          </div>
          <div style={{ padding: '6px' }}>
            {(grouped[tactic] || []).map((t, i) => {
              const intensity = Math.min(t.count / maxCount, 1);
              return (
                <div
                  key={i}
                  title={`${t.technique} — ${t.count} detections`}
                  style={{
                    padding: '6px 8px',
                    marginBottom: 4,
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    color: 'var(--text-primary)',
                    background: `rgba(${hexToRgb(TACTIC_COLORS[tactic] || '#00e5b0')}, ${0.1 + intensity * 0.4})`,
                    border: `1px solid rgba(${hexToRgb(TACTIC_COLORS[tactic] || '#00e5b0')}, ${0.2 + intensity * 0.4})`,
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.technique || 'Unknown'}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{t.count} detection{t.count !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default MitreMatrix;
