import React, { useState, useEffect } from 'react';
import { AttackTimeline } from '../components/AttackTimeline';

const API = 'http://localhost:8000';

export const Investigations: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API}/api/incidents`);
        if (res.ok) setIncidents(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const openDetail = async (inc: any) => {
    setSelected(inc);
    try {
      const res = await fetch(`${API}/api/timeline/incident/${inc.incident_id}`);
      if (res.ok) setTimeline(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch(`${API}/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setIncidents(prev => prev.map(i => i.incident_id === id ? { ...i, status } : i));
      if (selected?.incident_id === id) setSelected((s: any) => ({ ...s, status }));
    } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'new': return 'var(--critical)';
      case 'acknowledged': return 'var(--medium)';
      case 'investigating': return 'var(--indigo)';
      case 'resolved': return 'var(--teal)';
      case 'false_positive': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>📋 Investigations</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Security incidents with AI reasoning chains, evidence timelines, and MITRE ATT&CK mapping
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-card"><span className="stat-card__label">Total Incidents</span><span className="stat-card__value">{incidents.length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Open</span><span className="stat-card__value" style={{ color: 'var(--critical)' }}>{incidents.filter(i => i.status === 'new').length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Investigating</span><span className="stat-card__value" style={{ color: 'var(--indigo)' }}>{incidents.filter(i => i.status === 'investigating').length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Resolved</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{incidents.filter(i => i.status === 'resolved').length}</span></div>
      </div>

      {/* Incident List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {incidents.map((inc) => (
          <div
            key={inc.incident_id}
            className="card anim-fade-up"
            style={{ borderLeft: `4px solid ${statusColor(inc.status)}`, cursor: 'pointer' }}
            onClick={() => openDetail(inc)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{inc.title}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{inc.summary}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: inc.risk_score >= 70 ? 'var(--critical)' : inc.risk_score >= 40 ? 'var(--high)' : 'var(--medium)' }}>
                  {inc.risk_score}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RISK SCORE</div>
              </div>
            </div>

            {/* MITRE Badges */}
            {inc.mitre_techniques && inc.mitre_techniques.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {inc.mitre_techniques.map((t: string, i: number) => (
                  <span key={i} style={{
                    fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(99,110,240,0.15)', color: 'var(--indigo)',
                    border: '1px solid rgba(99,110,240,0.3)',
                  }}>{t}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: `${statusColor(inc.status)}20`, color: statusColor(inc.status),
              }}>{inc.status?.toUpperCase()}</span>

              <div style={{ display: 'flex', gap: 6 }}>
                {inc.status === 'new' && (
                  <button className="btn btn--ghost" style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                    onClick={(e) => { e.stopPropagation(); updateStatus(inc.incident_id, 'acknowledged'); }}>
                    Acknowledge
                  </button>
                )}
                {(inc.status === 'new' || inc.status === 'acknowledged') && (
                  <button className="btn btn--primary" style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                    onClick={(e) => { e.stopPropagation(); updateStatus(inc.incident_id, 'investigating'); }}>
                    Investigate
                  </button>
                )}
                {inc.status === 'investigating' && (
                  <>
                    <button className="btn btn--primary" style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      onClick={(e) => { e.stopPropagation(); updateStatus(inc.incident_id, 'resolved'); }}>
                      Resolve
                    </button>
                    <button className="btn btn--ghost" style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      onClick={(e) => { e.stopPropagation(); updateStatus(inc.incident_id, 'false_positive'); }}>
                      False Positive
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {incidents.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No investigations currently open. Start telemetry replay to generate incidents.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,13,26,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => { setSelected(null); setTimeline(null); }}
        >
          <div
            className="card"
            style={{ width: 700, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selected.title}</h2>
              <button onClick={() => { setSelected(null); setTimeline(null); }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{selected.summary}</p>

            {/* AI Explanation */}
            {selected.ai_explanation && (
              <div style={{ background: 'rgba(99,110,240,0.08)', border: '1px solid rgba(99,110,240,0.2)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--indigo)', marginBottom: 6, textTransform: 'uppercase' }}>🤖 AI Analysis</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.ai_explanation}</p>
              </div>
            )}

            {/* Recommendation */}
            {selected.recommendation && (
              <div style={{ background: 'rgba(0,229,176,0.08)', border: '1px solid rgba(0,229,176,0.2)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', marginBottom: 6, textTransform: 'uppercase' }}>💡 Recommendation</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.recommendation}</p>
              </div>
            )}

            {/* Evidence Chain */}
            {selected.evidence_chain && selected.evidence_chain.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Evidence Chain</div>
                {selected.evidence_chain.map((e: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--medium)' }}>→</span> {e}
                  </div>
                ))}
              </div>
            )}

            {/* MITRE Mapping */}
            {selected.mitre_tactics && selected.mitre_tactics.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>MITRE ATT&CK Mapping</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.mitre_tactics.map((t: string, i: number) => (
                    <span key={`t-${i}`} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(255,59,107,0.1)', color: 'var(--critical)', border: '1px solid rgba(255,59,107,0.2)' }}>{t}</span>
                  ))}
                  {selected.mitre_techniques?.map((t: string, i: number) => (
                    <span key={`te-${i}`} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 4, background: 'rgba(99,110,240,0.1)', color: 'var(--indigo)', border: '1px solid rgba(99,110,240,0.2)' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Event Timeline */}
            {timeline && timeline.timeline && timeline.timeline.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <AttackTimeline events={timeline.timeline} title="Attack Timeline" />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => { setSelected(null); setTimeline(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investigations;
