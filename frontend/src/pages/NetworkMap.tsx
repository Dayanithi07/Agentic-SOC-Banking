import React, { useState, useEffect } from 'react';
import { NetworkTopology } from '../components/NetworkTopology';

const API = 'http://localhost:8000';

export const NetworkMap: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [usRes, epRes, srcRes] = await Promise.all([
          fetch(`${API}/api/analytics/top-users`),
          fetch(`${API}/api/analytics/top-endpoints`),
          fetch(`${API}/api/analytics/event-sources`),
        ]);
        if (usRes.ok) setUsers(await usRes.json());
        if (epRes.ok) setEndpoints(await epRes.json());
        if (srcRes.ok) setSources(await srcRes.json());
      } catch (e) { console.error(e); }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalTraffic = users.reduce((s, u) => s + u.event_count, 0);

  return (
    <div className="main-content">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>🌐 Network Map</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Interactive network topology showing users, endpoints, and traffic flow — live animated
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        <div className="stat-card"><span className="stat-card__label">Active Users</span><span className="stat-card__value">{users.length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Endpoints</span><span className="stat-card__value" style={{ color: 'var(--teal)' }}>{endpoints.length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Data Sources</span><span className="stat-card__value" style={{ color: 'var(--indigo)' }}>{sources.length}</span></div>
        <div className="stat-card"><span className="stat-card__label">Total Traffic</span><span className="stat-card__value" style={{ color: 'var(--medium)' }}>{totalTraffic}</span><span className="stat-card__sub">events tracked</span></div>
      </div>

      {/* Network Topology Canvas */}
      <div className="card">
        <div className="section-head"><h2>Live Network Topology</h2></div>
        <NetworkTopology users={users} endpoints={endpoints} />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>🔵 Users</span>
          <span>🟢 Endpoints</span>
          <span>🟠 SOC Core</span>
          <span>🔴 Database</span>
          <span style={{ color: '#ff3b6b' }}>━ Suspicious traffic</span>
          <span style={{ color: '#00e5b0' }}>━ Normal traffic</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Top Users Table */}
        <div className="card">
          <div className="section-head"><h2>User Activity</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>User</th>
                <th style={{ textAlign: 'right', padding: '6px 10px' }}>Events</th>
                <th style={{ textAlign: 'right', padding: '6px 10px' }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>👤 {u.user_id}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{u.event_count}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                      background: u.event_count > 20 ? 'rgba(255,59,107,0.1)' : 'rgba(0,229,176,0.1)',
                      color: u.event_count > 20 ? 'var(--critical)' : 'var(--teal)',
                    }}>
                      {u.event_count > 20 ? 'HIGH' : 'NORMAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data Sources */}
        <div className="card">
          <div className="section-head"><h2>Data Sources</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((s: any) => (
              <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>📡 {s.source}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cyan)' }}>{s.count} events</span>
              </div>
            ))}
            {sources.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No data yet. Start telemetry replay.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkMap;
