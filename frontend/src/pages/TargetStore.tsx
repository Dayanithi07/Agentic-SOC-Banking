import React, { useState, useCallback } from 'react';
import { useTelemetryWebSocket, API_BASE } from '../hooks/useTelemetryWebSocket';

const API = API_BASE;

export const TargetStore: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('http://localhost:3000');
  const [activeUrl, setActiveUrl] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [monitorStatus, setMonitorStatus] = useState<'idle' | 'monitoring' | 'offline'>('idle');
  const [eventCount, setEventCount] = useState(0);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
  }, []);

  const { status: wsStatus } = useTelemetryWebSocket({
    onEvent: (ev) => {
      setEventCount(c => c + 1);
      const sev = ev.severity === 'critical' ? '🔴' : ev.severity === 'high' ? '🟠' : '🟢';
      addLog(`${sev} ${ev.event_type} | ${ev.source} | ${ev.user || '—'} | risk:${ev.risk_score}`);
    },
    onIncident: (inc) => {
      addLog(`🚨 INCIDENT: ${inc.title} (risk: ${inc.risk_score})`);
    },
  });

  const handleConnectWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    setActiveUrl(url);
    setMonitorStatus('monitoring');
    addLog(`🌐 Connected live website: ${url}`);

    try {
      const res = await fetch(`${API}/api/monitor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: url }),
      });
      if (res.ok) {
        addLog(`✅ Continuous monitoring started — health checks every 15s`);
      }
    } catch {
      addLog(`⚠️ Could not register site for continuous monitoring`);
    }
  };

  const triggerWebsiteAttack = async (attackType: string) => {
    const target = activeUrl || websiteUrl || 'http://localhost:3000';
    addLog(`⚡ Sending ${attackType} telemetry for ${target}...`);

    let payload: Record<string, unknown> = {
      event_type: 'web_request',
      endpoint: `${target}/api/login`,
      http_method: 'POST',
      severity: 'info',
      metadata: { origin: target },
    };

    if (attackType === 'brute_force') {
      payload = {
        event_type: 'login_failure', user_id: 'admin', ip_address: '198.51.100.99',
        endpoint: `${target}/api/auth/login`, http_method: 'POST', severity: 'medium',
        mitre_tactic: 'Credential Access', mitre_technique: 'T1110 - Brute Force',
        metadata: { status_code: 401, origin: target },
      };
    } else if (attackType === 'idor') {
      payload = {
        event_type: 'access_control_violation', user_id: 'user_102', ip_address: '198.51.100.99',
        endpoint: `${target}/api/orders/ORD-999`, http_method: 'GET', severity: 'critical',
        mitre_tactic: 'Privilege Escalation', mitre_technique: 'T1548 - Abuse Elevation Control Mechanism',
        metadata: { attempted_access: 'admin', status_code: 403, origin: target },
      };
    } else if (attackType === 'sqli') {
      payload = {
        event_type: 'sql_injection_attempt', user_id: 'attacker_x', ip_address: '198.51.100.99',
        endpoint: `${target}/products?search=%27%20OR%201=1`, http_method: 'GET', severity: 'critical',
        mitre_tactic: 'Initial Access', mitre_technique: 'T1190 - Exploit Public-Facing Application',
        metadata: { payload: "' OR 1=1 --", origin: target },
      };
    } else if (attackType === 'exfil') {
      payload = {
        event_type: 'data_export', user_id: 'svc-billing', ip_address: '198.51.100.99',
        endpoint: `${target}/api/reports/export`, http_method: 'POST', severity: 'high',
        mitre_tactic: 'Exfiltration', mitre_technique: 'T1041 - Exfiltration Over C2 Channel',
        metadata: { records_exported: 12500, origin: target },
      };
    }

    try {
      const res = await fetch(`${API}/api/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        addLog(`💥 Ingested ${attackType.toUpperCase()} → AI SOC Agents analyzing...`);
      }
    } catch {
      addLog(`⚠️ Error connecting to SOC backend`);
    }
  };

  const sdkCodeSnippet = `<script src="${API}/api/sdk/soc-agent.js"></script>`;
  const wsColor = wsStatus === 'live' ? 'var(--teal)' : 'var(--text-muted)';

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            🌐 Monitor Your Live Real Website
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Continuous monitoring with 15s health checks + real-time WebSocket telemetry stream
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{eventCount} events received</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: wsColor, boxShadow: `0 0 6px ${wsColor}` }} />
          <span style={{ fontSize: '0.72rem', color: wsColor, fontWeight: 600 }}>
            {wsStatus === 'live' ? '● LIVE' : '○ OFFLINE'}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, border: '1px solid var(--cyan-dim)', background: 'rgba(0, 229, 176, 0.03)' }}>
        <form onSubmit={handleConnectWebsite} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.2rem' }}>🔗</div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Enter Your Live Demo Website URL:
            </div>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="http://localhost:3000 or https://your-website.com"
              style={{
                width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: '0.82rem',
              }}
            />
          </div>
          <button type="submit" className="btn btn--primary" style={{ padding: '8px 16px', marginTop: 18 }}>
            {monitorStatus === 'monitoring' ? '🔄 Monitoring...' : 'Connect Live Website'}
          </button>
        </form>
        {monitorStatus === 'monitoring' && (
          <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--teal)' }}>
            ✓ Continuous health monitoring active for {activeUrl}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-head">
            <h2>🖥️ Live Website View {activeUrl && <span style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>({activeUrl})</span>}</h2>
          </div>

          {activeUrl ? (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', height: 320, background: '#fff' }}>
              <iframe src={activeUrl} title="Live Target Website" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
          ) : (
            <div style={{
              height: 200, borderRadius: 8, border: '1px dashed var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, color: 'var(--text-muted)',
            }}>
              <span style={{ fontSize: '2rem' }}>🌐</span>
              <span style={{ fontSize: '0.8rem' }}>Enter your website URL above and click "Connect Live Website"</span>
            </div>
          )}

          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,59,107,0.05)', border: '1px solid rgba(255,59,107,0.2)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--critical)', marginBottom: 8 }}>
              🔥 Inject Live Attack Telemetry:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['brute_force', '💥 Brute Force'],
                ['idor', '💥 IDOR Violation'],
                ['sqli', '💥 SQL Injection'],
                ['exfil', '💥 Data Exfiltration'],
              ].map(([type, label]) => (
                <button key={type} className="btn btn--ghost"
                  style={{ fontSize: '0.75rem', borderColor: 'var(--critical)', color: 'var(--critical)' }}
                  onClick={() => triggerWebsiteAttack(type)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ borderColor: 'var(--cyan-dim)', background: 'rgba(0, 229, 176, 0.03)' }}>
            <div className="section-head"><h2>⚡ 1-Line JS SDK for Real Website</h2></div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Paste this script tag into your website HTML to auto-capture live traffic:
            </p>
            <pre style={{
              background: '#0d1117', padding: 10, borderRadius: 6,
              fontSize: '0.75rem', color: 'var(--cyan)', overflowX: 'auto', border: '1px solid var(--border)',
            }}>
              {sdkCodeSnippet}
            </pre>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Ingestion: <code style={{ color: 'var(--text-primary)' }}>POST {API}/api/telemetry/ingest</code>
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
            <div className="section-head">
              <h2>⚡ Live Telemetry Console {wsStatus === 'live' && <span style={{ color: 'var(--teal)', fontSize: '0.7rem' }}>● streaming</span>}</h2>
            </div>
            <div style={{
              flex: 1, background: '#090d13', borderRadius: 6, padding: 10,
              fontFamily: 'monospace', fontSize: '0.72rem', color: '#a0aec0',
              overflowY: 'auto', border: '1px solid var(--border)', maxHeight: 320,
            }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 30 }}>
                  Connect a website or click attack buttons — events stream here in real-time via WebSocket
                </div>
              ) : (
                logs.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetStore;
