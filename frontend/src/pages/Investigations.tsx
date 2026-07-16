import React, { useState } from 'react';

interface Case {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee: string;
  created: string;
  events: number;
  summary: string;
}

const CASES: Case[] = [
  { id: 'INC-001', title: 'Coordinated Brute Force Campaign', severity: 'critical', status: 'in_progress', assignee: 'priya.nair', created: '2h ago', events: 24, summary: 'Multiple accounts targeted from rotating IPs. Possible credential stuffing via botnet.' },
  { id: 'INC-002', title: 'Suspicious Privileged Access - Core Banking', severity: 'critical', status: 'open', assignee: 'Unassigned', created: '45m ago', events: 7, summary: 'Admin-level SQL queries executed on SWIFT gateway without change ticket.' },
  { id: 'INC-003', title: 'Anomalous After-Hours Data Export', severity: 'high', status: 'in_progress', assignee: 'ravi.kumar', created: '3h ago', events: 12, summary: '18 GB exported to external S3 bucket by service account between 2-4 AM.' },
  { id: 'INC-004', title: 'MFA Bypass Attempt - Multiple Accounts', severity: 'high', status: 'open', assignee: 'Unassigned', created: '1h ago', events: 9, summary: 'OTP tokens replayed across 3 accounts within seconds. Possible SIM swap or SS7 attack.' },
  { id: 'INC-005', title: 'Lateral Movement Across Payment Subnet', severity: 'high', status: 'in_progress', assignee: 'john.smith', created: '5h ago', events: 31, summary: 'Sequential RDP access across 14 hosts on payment processing VLAN.' },
  { id: 'INC-006', title: 'Policy Violation - Bulk PII Access', severity: 'medium', status: 'resolved', assignee: 'priya.nair', created: '1d ago', events: 4, summary: 'Customer records accessed beyond user job scope. Confirmed as mistaken access - no exfil.' },
];

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)',
};
const STATUS_COLOR: Record<string, string> = {
  open: 'var(--critical)', in_progress: 'var(--medium)', resolved: 'var(--teal)', closed: 'var(--text-muted)',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};

export const Investigations: React.FC = () => {
  const [selected, setSelected] = useState<Case | null>(null);
  const [filter, setFilter]     = useState('all');

  const filtered = CASES.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>📋 Investigations</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Active incident cases and investigation tracker</p>
        </div>
        <button className="btn btn--primary" style={{ fontSize: '0.8rem' }}>+ New Case</button>
      </div>

      {/* Summary */}
      <div className="grid-4">
        {[
          { label: 'Total Cases',   value: CASES.length,                                    color: '' },
          { label: 'Open',          value: CASES.filter(c => c.status === 'open').length,   color: 'var(--critical)' },
          { label: 'In Progress',   value: CASES.filter(c => c.status === 'in_progress').length, color: 'var(--medium)' },
          { label: 'Resolved',      value: CASES.filter(c => c.status === 'resolved').length,     color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-card__label">{s.label}</span>
            <span className="stat-card__value" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[['all', 'All'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['closed', 'Closed']].map(([v, l]) => (
          <button
            key={v}
            className={`btn ${filter === v ? 'btn--primary' : 'btn--ghost'}`}
            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
            onClick={() => setFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Case List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((c, i) => (
          <div
            key={c.id}
            className="card anim-fade-up"
            style={{ cursor: 'pointer', animationDelay: `${i * 50}ms`, borderColor: selected?.id === c.id ? 'var(--border-active)' : undefined }}
            onClick={() => setSelected(selected?.id === c.id ? null : c)}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.id}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.title}</span>
                  <span className={`badge badge--${c.severity}`}>{c.severity}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 600, background: `${STATUS_COLOR[c.status]}20`, color: STATUS_COLOR[c.status], border: `1px solid ${STATUS_COLOR[c.status]}40` }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.summary}</p>
                {selected?.id === c.id && (
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      ['Assignee',  c.assignee],
                      ['Created',   c.created],
                      ['Events',    c.events.toString()],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: '8px 12px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: 3, fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.created}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{c.events} events</div>
              </div>
            </div>
            {selected?.id === c.id && (
              <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>View Timeline</button>
                <button className="btn btn--ghost" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Assign</button>
                <button className="btn btn--primary" style={{ fontSize: '0.78rem', padding: '5px 12px' }}>Open Investigation &rarr;</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
