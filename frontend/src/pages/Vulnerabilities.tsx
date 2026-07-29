import React, { useState, useEffect } from 'react';

export const Vulnerabilities: React.FC = () => {
  const [findings, setFindings] = useState<any[]>([]);

  const fetchFindings = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/findings');
      if (res.ok) {
        setFindings(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runAssessment = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/assessment/run', { method: 'POST' });
      if (res.ok) {
        fetchFindings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>🛡️ Security Findings</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vulnerabilities detected by SOCShield Assessment Agent</p>
        </div>
        <button className="btn btn--primary" onClick={runAssessment}>
          Run Assessment
        </button>
      </div>

      <div className="card">
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px' }}>Finding</th>
              <th style={{ padding: '8px' }}>Category</th>
              <th style={{ padding: '8px' }}>Endpoint</th>
              <th style={{ padding: '8px' }}>Severity</th>
              <th style={{ padding: '8px' }}>Risk</th>
              <th style={{ padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{f.title}</td>
                <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{f.category}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{f.affected_endpoint}</td>
                <td style={{ padding: '8px', color: f.severity === 'High' ? 'var(--high)' : 'var(--medium)' }}>
                  {f.severity}
                </td>
                <td style={{ padding: '8px' }}>{f.risk_score}</td>
                <td style={{ padding: '8px' }}>{f.status}</td>
              </tr>
            ))}
            {findings.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No findings detected. Run an assessment to check the target application.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vulnerabilities;
