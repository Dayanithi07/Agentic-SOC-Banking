import React, { useState } from 'react';

interface ConnectorStatus { name: string; icon: string; connected: boolean; lastSync: string; eventsToday: number; }

const CONNECTORS: ConnectorStatus[] = [
  { name: 'Azure AD',      icon: '☁️',  connected: true,  lastSync: '12s ago', eventsToday: 543  },
  { name: 'CrowdStrike',   icon: '🦅',  connected: true,  lastSync: '45s ago', eventsToday: 329  },
  { name: 'SentinelOne',   icon: '🛡️', connected: false, lastSync: '2h ago',  eventsToday: 0    },
  { name: 'Palo Alto NGFW',icon: '🌐',  connected: true,  lastSync: '5s ago',  eventsToday: 2104 },
  { name: 'Cisco Duo',     icon: '🔐',  connected: true,  lastSync: '1m ago',  eventsToday: 217  },
  { name: 'Okta',          icon: '🔑',  connected: true,  lastSync: '30s ago', eventsToday: 891  },
];

export const Settings: React.FC = () => {
  const [geminiKey, setGeminiKey]   = useState('sk-••••••••••••••••••••••••••');
  const [threshold, setThreshold]   = useState(70);
  const [autoBlock, setAutoBlock]   = useState(false);
  const [emailAlert, setEmailAlert] = useState(true);
  const [slackHook, setSlackHook]   = useState('https://hooks.slack.com/services/•••/•••');
  const [saved, setSaved]           = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? 'var(--teal)' : 'var(--bg-secondary)',
        border: `1px solid ${value ? 'var(--teal)' : 'var(--border)'}`,
        cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
        boxShadow: value ? '0 0 8px var(--teal)' : 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)', fontSize: '0.82rem', outline: 'none',
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>⚙️ Settings</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Configure connectors, AI settings, and alert thresholds</p>
        </div>
        <button className="btn btn--primary" onClick={save}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Connectors */}
      <div className="card">
        <div className="section-head"><h2>Security Connectors</h2></div>
        <div className="grid-3">
          {CONNECTORS.map(c => (
            <div key={c.name} style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px', border: `1px solid ${c.connected ? 'rgba(0,229,176,0.2)' : 'rgba(255,59,107,0.2)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                </div>
                <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 999, background: c.connected ? 'rgba(0,229,176,0.1)' : 'rgba(255,59,107,0.1)', color: c.connected ? 'var(--teal)' : 'var(--critical)', fontWeight: 600 }}>
                  {c.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last sync: {c.lastSync}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Events today: {c.eventsToday.toLocaleString()}</div>
              <button
                className={`btn ${c.connected ? 'btn--ghost' : 'btn--primary'}`}
                style={{ fontSize: '0.72rem', padding: '4px 10px', marginTop: 8, width: '100%' }}
              >
                {c.connected ? 'Configure' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* AI Configuration */}
        <div className="card">
          <div className="section-head"><h2>AI Configuration</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Gemini API Key</label>
              <input style={inputStyle} type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Risk Score Threshold (Alert at &ge; {threshold})
              </label>
              <input type="range" min={0} max={100} value={threshold} onChange={e => setThreshold(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--cyan)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <span>0 (Low)</span><span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{threshold}</span><span>100 (Critical)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="section-head"><h2>Notifications</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email Alerts</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Send critical alerts by email</div>
              </div>
              <Toggle value={emailAlert} onChange={setEmailAlert} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Auto-Block on Critical</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Automatically block IPs on critical alerts</div>
              </div>
              <Toggle value={autoBlock} onChange={setAutoBlock} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Slack Webhook URL</label>
              <input style={inputStyle} value={slackHook} onChange={e => setSlackHook(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
