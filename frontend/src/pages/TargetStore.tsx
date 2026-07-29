import React, { useState } from 'react';

const API = 'http://localhost:8000';

export const TargetStore: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // 1-Click Interactive Actions
  const handleLogin = async (username: string, pass: string) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(username);
        addLog(`✅ Logged in successfully as ${username}`);
      } else {
        addLog(`❌ Login failed for ${username} (HTTP 401) — Sent to SOC Copilot`);
      }
    } catch {
      addLog(`⚠️ Could not reach backend server`);
    }
  };

  const handleFetchOrder = async (orderId: string) => {
    try {
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`📦 Fetched Order ${orderId}: ${JSON.stringify(data)}`);
      } else {
        addLog(`🔴 Access Denied on Order ${orderId} (HTTP ${res.status}) — Triggered IDOR Violation Alert!`);
      }
    } catch {
      addLog(`⚠️ Server error`);
    }
  };

  // Simulate Attack Scenarios
  const triggerAttack = async (type: 'brute_force' | 'idor' | 'sqli' | 'exfil') => {
    if (type === 'brute_force') {
      addLog(`⚡ Simulating Brute Force Attack on /api/auth/login...`);
      for (let i = 0; i < 5; i++) {
        await handleLogin('admin', `wrong_pass_${i}`);
        await new Promise(r => setTimeout(r, 200));
      }
    } else if (type === 'idor') {
      addLog(`⚡ Simulating IDOR Attack: Accessing admin order ORD-2 with john.smith token...`);
      await handleLogin('john.smith', 'password123');
      await handleFetchOrder('ORD-2');
    } else if (type === 'sqli') {
      addLog(`⚡ Ingesting SQL Injection Attack payload to /api/products...`);
      await fetch(`${API}/api/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'sql_injection_attempt',
          user_id: 'attacker_x',
          ip_address: '198.51.100.99',
          endpoint: '/api/products?id=1%27%20OR%201=1',
          http_method: 'GET',
          severity: 'critical',
          mitre_tactic: 'Initial Access',
          mitre_technique: 'T1190 - Exploit Public-Facing Application',
          metadata: { payload: "' OR 1=1 --", status_code: 500 }
        })
      });
      addLog(`💥 SQL Injection Telemetry sent to SOC Copilot!`);
    } else if (type === 'exfil') {
      addLog(`⚡ Ingesting Bulk Data Exfiltration attack to /api/reports/export...`);
      await fetch(`${API}/api/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'data_export',
          user_id: 'svc-billing',
          ip_address: '198.51.100.99',
          endpoint: '/api/reports/export',
          http_method: 'POST',
          severity: 'high',
          mitre_tactic: 'Exfiltration',
          mitre_technique: 'T1041 - Exfiltration Over C2 Channel',
          metadata: { records_exported: 12500, format: 'CSV' }
        })
      });
      addLog(`💥 Data Exfiltration Telemetry sent to SOC Copilot!`);
    }
  };

  const sdkCodeSnippet = `<script src="${API}/api/sdk/soc-agent.js"></script>`;

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          🛍️ Live Target Store & Website Integration SDK
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Interact with the live target website or copy the 1-line JS SDK to monitor ANY live website in real time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        
        {/* Left: Interactive E-Commerce Website Simulator */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-head">
            <h2>🛒 E-Commerce Website Simulator</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--teal)' }}>
              {currentUser ? `Logged in: ${currentUser}` : 'Guest User'}
            </span>
          </div>

          {/* User Auth Buttons */}
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>1. Authenticate User:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost" onClick={() => handleLogin('john.smith', 'password123')}>
                Login as john.smith
              </button>
              <button className="btn btn--ghost" onClick={() => handleLogin('admin', 'admin_pass')}>
                Login as admin
              </button>
              <button className="btn btn--ghost" onClick={() => handleLogin('hacker', 'wrong_pass')}>
                Failed Login
              </button>
            </div>
          </div>

          {/* API Order Access */}
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>2. Access Orders (IDOR Testing):</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost" onClick={() => handleFetchOrder('ORD-1')}>
                Fetch ORD-1 (john.smith)
              </button>
              <button className="btn btn--ghost" onClick={() => handleFetchOrder('ORD-2')}>
                Fetch ORD-2 (admin)
              </button>
            </div>
          </div>

          {/* Instant Attack Simulator Buttons */}
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,59,107,0.05)', border: '1px solid rgba(255,59,107,0.2)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--critical)', marginBottom: 8 }}>
              🔥 1-Click Live Attack Trigger:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button className="btn btn--ghost" style={{ fontSize: '0.75rem', borderColor: 'var(--critical)', color: 'var(--critical)' }} onClick={() => triggerAttack('brute_force')}>
                💥 Trigger Brute Force Attack
              </button>
              <button className="btn btn--ghost" style={{ fontSize: '0.75rem', borderColor: 'var(--critical)', color: 'var(--critical)' }} onClick={() => triggerAttack('idor')}>
                💥 Trigger IDOR Violation
              </button>
              <button className="btn btn--ghost" style={{ fontSize: '0.75rem', borderColor: 'var(--critical)', color: 'var(--critical)' }} onClick={() => triggerAttack('sqli')}>
                💥 Trigger SQL Injection
              </button>
              <button className="btn btn--ghost" style={{ fontSize: '0.75rem', borderColor: 'var(--critical)', color: 'var(--critical)' }} onClick={() => triggerAttack('exfil')}>
                💥 Trigger Data Exfiltration
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Website Integration SDK & Log Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SDK Code Snippet Panel */}
          <div className="card" style={{ borderColor: 'var(--cyan-dim)', background: 'rgba(0, 229, 176, 0.03)' }}>
            <div className="section-head">
              <h2>🌐 Embed in ANY Live Website</h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Paste this 1-line JavaScript SDK into the <code>&lt;head&gt;</code> of any HTML website to stream live traffic & attack telemetry into Agentic SOC Copilot:
            </p>
            <pre style={{
              background: '#0d1117', padding: 10, borderRadius: 6,
              fontSize: '0.75rem', color: 'var(--cyan)', overflowX: 'auto', border: '1px solid var(--border)'
            }}>
              {sdkCodeSnippet}
            </pre>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Telemetry Endpoint: <code style={{ color: 'var(--text-primary)' }}>POST http://localhost:8000/api/telemetry/ingest</code>
            </div>
          </div>

          {/* Activity Log Output */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 250 }}>
            <div className="section-head">
              <h2>⚡ Live Activity Console</h2>
            </div>
            <div style={{
              flex: 1, background: '#090d13', borderRadius: 6, padding: 10,
              fontFamily: 'monospace', fontSize: '0.72rem', color: '#a0aec0',
              overflowY: 'auto', border: '1px solid var(--border)'
            }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
                  Click buttons on the left to generate real-time website traffic & attacks
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
