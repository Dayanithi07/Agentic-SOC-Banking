import React, { useState, useEffect } from 'react';


export const Settings: React.FC = () => {
  const [geminiKey, setGeminiKey]   = useState('sk-••••••••••••••••••••••••••');
  const [threshold, setThreshold]   = useState(70);
  const [autoBlock, setAutoBlock]   = useState(false);
  const [emailAlert, setEmailAlert] = useState(true);
  const [slackHook, setSlackHook]   = useState('https://hooks.slack.com/services/•••/•••');
  const [saved, setSaved]           = useState(false);

  const [replayState, setReplayState] = useState({ status: 'stopped', speed: 10, progress: 0 });

  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/replay/status');
        if (res.ok) {
            const data = await res.json();
            setReplayState(data);
        }
      } catch(e) {}
    };
    fetchReplay();
    const interval = setInterval(fetchReplay, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReplayAction = async (action: string) => {
    await fetch(`http://localhost:8000/api/replay/${action}`, { method: 'POST' });
    const res = await fetch('http://localhost:8000/api/replay/status');
    if (res.ok) {
        const data = await res.json();
        setReplayState(data);
    }
  };

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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Configure E-commerce telemetry, AI settings, and alert thresholds</p>
        </div>
        <button className="btn btn--primary" onClick={save}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Telemetry Replay */}
      <div className="card">
        <div className="section-head"><h2>Telemetry Replay</h2></div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dataset</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ecommerce_security_scenarios.jsonl</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status</div>
              <div style={{ fontSize: '0.72rem', color: replayState.status === 'running' ? 'var(--teal)' : 'var(--text-muted)' }}>
                {replayState.status === 'running' ? '● Running' : replayState.status}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Speed</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{replayState.speed}×</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Progress</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{replayState.progress}%</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn--primary" onClick={() => handleReplayAction('start')}>Start</button>
            <button className="btn btn--ghost" onClick={() => handleReplayAction('pause')}>Pause</button>
            <button className="btn btn--ghost" onClick={() => handleReplayAction('stop')}>Stop</button>
            <button className="btn btn--ghost" onClick={() => handleReplayAction('restart')}>Restart</button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '20px' }}>
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
