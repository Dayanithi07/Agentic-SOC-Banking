import React, { useState } from 'react';
import { generateEvents } from '../hooks/useApi';
import { EventDetail } from '../components/EventDetail';
import type { TelemetryEvent } from '../types';

const MITRE: { id: string; name: string; count: number; color: string }[] = [
  { id: 'T1078', name: 'Valid Accounts',          count: 8,  color: 'var(--critical)' },
  { id: 'T1110', name: 'Brute Force',             count: 6,  color: 'var(--high)'     },
  { id: 'T1021', name: 'Remote Services',         count: 5,  color: 'var(--high)'     },
  { id: 'T1083', name: 'File & Dir Discovery',    count: 4,  color: 'var(--medium)'   },
  { id: 'T1048', name: 'Exfil Over Alt Protocol', count: 3,  color: 'var(--medium)'   },
  { id: 'T1098', name: 'Account Manipulation',    count: 3,  color: 'var(--medium)'   },
  { id: 'T1071', name: 'App Layer Protocol',      count: 2,  color: 'var(--low)'      },
  { id: 'T1059', name: 'Command & Scripting',     count: 2,  color: 'var(--low)'      },
];

const HUNT_QUERIES = [
  { label: 'Failed logins > 5 in 10 min',      desc: 'Potential brute force or credential stuffing' },
  { label: 'MFA bypass from multiple IPs',      desc: 'Token theft or session hijacking' },
  { label: 'Large file transfers after hours',  desc: 'Data exfiltration window' },
  { label: 'Admin commands without ticket',     desc: 'Insider threat or compromised admin' },
  { label: 'Lateral movement across subnets',   desc: 'Active attacker moving inside network' },
  { label: 'New service accounts created',       desc: 'Persistence mechanism installation' },
];

export const ThreatHunt: React.FC = () => {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<TelemetryEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<TelemetryEvent | null>(null);

  const hunt = async (q?: string) => {
    const searchQ = q ?? query;
    if (!searchQ) return;
    setRunning(true);
    await new Promise(r => setTimeout(r, 800));
    const all = generateEvents(60);
    const matches = all.filter(e =>
      e.event_type.toLowerCase().includes(searchQ.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQ.toLowerCase()) ||
      e.source.toLowerCase().includes(searchQ.toLowerCase())
    );
    setResults(matches.length > 0 ? matches : all.slice(0, 5));
    setRunning(false);
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>🔍 Threat Hunt</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Proactively hunt for threats using AI-powered queries and MITRE ATT&CK mapping
        </p>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
            placeholder="Hunt query: e.g. brute force, lateral movement, data exfil..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && hunt()}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-active)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button className="btn btn--primary" onClick={() => hunt()} disabled={running} style={{ minWidth: 120 }}>
            {running ? '⟳ Hunting...' : '🔍 Hunt'}
          </button>
        </div>

        {/* Pre-built queries */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Quick Hunt Queries
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {HUNT_QUERIES.map(q => (
              <button
                key={q.label}
                className="btn btn--ghost"
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                title={q.desc}
                onClick={() => { setQuery(q.label); hunt(q.label); }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Results */}
        <div className="card">
          <div className="section-head">
            <h2>Hunt Results {results.length > 0 && `(${results.length} matches)`}</h2>
          </div>
          {results.length === 0 && !running && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
              Enter a hunt query above to start searching for threats
            </div>
          )}
          {running && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8, animation: 'pulse-ring 1s infinite' }}>⟳</div>
              Scanning security telemetry...
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map(ev => (
              <div
                key={ev.id}
                onClick={() => setSelected(ev)}
                style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-active)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span className={`badge badge--${ev.severity}`} style={{ alignSelf: 'center', flexShrink: 0 }}>{ev.severity}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.event_type}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ev.source} &bull; {ev.user ?? 'unknown'}</div>
                </div>
                <span style={{ fontWeight: 700, color: ev.risk_score >= 80 ? 'var(--critical)' : ev.risk_score >= 60 ? 'var(--high)' : 'var(--medium)', alignSelf: 'center' }}>{ev.risk_score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MITRE ATT&CK */}
        <div className="card">
          <div className="section-head"><h2>MITRE ATT&CK Detections</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MITRE.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: `1px solid ${m.color}30` }}>
                <div style={{ padding: '2px 8px', borderRadius: 4, background: `${m.color}20`, color: m.color, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600, flexShrink: 0 }}>
                  {m.id}
                </div>
                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{m.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 60, height: 5, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(m.count / 8) * 100}%`, background: m.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: m.color, width: 16, textAlign: 'right' }}>{m.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};
