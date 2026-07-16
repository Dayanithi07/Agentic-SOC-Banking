import { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Terminal, 
  Network, 
  Play, 
  CheckCircle, 
  RefreshCw, 
  FileText, 
  X, 
  User, 
  Database, 
  Server, 
  Globe, 
  AlertOctagon,
  CornerDownRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

// --- RICH FALLBACK SAMPLE DATA FOR DESIGN HYDRATION ---
const SAMPLE_LOGS = [
  { event_id: 'l-001', source: 'iam', timestamp: '2026-07-16T14:10:05Z', raw: {}, message: 'Anomalous remote interactive login for user svc-database from IP 185.220.101.4' },
  { event_id: 'l-002', source: 'policy', timestamp: '2026-07-16T14:10:20Z', raw: {}, message: 'Security Policy Alert: Access attempt outside standard working hours (02:10 AM UTC)' },
  { event_id: 'l-003', source: 'iam', timestamp: '2026-07-16T14:11:15Z', raw: {}, message: 'Privilege elevation requested: user svc-database elevated to DBA Role via vault-session-812' },
  { event_id: 'l-004', source: 'database', timestamp: '2026-07-16T14:12:45Z', raw: {}, message: 'Anomalous Query Executed: SELECT * FROM customer_credit_cards LIMIT 1000000; (Role: DBA)' },
  { event_id: 'l-005', source: 'network', timestamp: '2026-07-16T14:14:00Z', raw: {}, message: 'Data egress warning: Outbound TCP session to 185.220.101.4 transferred 4.8 GB on port 443' },
  { event_id: 'l-006', source: 'edr', timestamp: '2026-07-16T14:15:30Z', raw: {}, message: 'Suspicious process execution: powershell.exe -ExecutionPolicy Bypass -File C:\\Users\\Public\\update.ps1' },
];

const SAMPLE_INCIDENTS = [
  {
    id: 'INC-2026-081',
    title: 'Privileged Insider Access Misuse & Database Exfiltration',
    severity: 'critical',
    risk_score: 95,
    status: 'Open',
    timestamp: '2026-07-16T14:10:05Z',
    agents: ['Identity Agent', 'Database Agent', 'Network Agent', 'Policy Agent'],
    explanation: 'A collaborative analysis identified a critical multi-stage threat targeting sensitive banking databases. The attack vector indicates credential compromise of service account "svc-database", followed by privilege escalation, unauthorized bulk database reads, and secure data exfiltration to a known Tor exit node IP.',
    timeline: [
      { id: 't1', source: 'iam', time: '14:10:05', title: 'Anomalous IAM Login', desc: 'Anomalous remote interactive login for user svc-database from IP 185.220.101.4 (Tor exit node).' },
      { id: 't2', source: 'policy', time: '14:10:20', title: 'Policy Out of Hours Access', desc: 'Alert: Login occurred outside normal operating hours for this service account.' },
      { id: 't3', source: 'iam', time: '14:11:15', title: 'DBA Privilege Elevation', desc: 'Request granted elevating svc-database to high-privilege DBA credentials.' },
      { id: 't4', source: 'database', time: '14:12:45', title: 'Bulk Sensitive Read', desc: 'Query executed fetching 1,000,000 credit card entries from active customer database table.' },
      { id: 't5', source: 'network', time: '14:14:00', title: 'High Volume Data Egress', desc: '4.8 GB outbound egress detected towards same destination IP (185.220.101.4) over port 443.' }
    ],
    mitre: ['Initial Access', 'Privilege Escalation', 'Credential Access', 'Exfiltration'],
    actions: [
      { id: 'act-1', name: 'Revoke compromised LDAP keys', desc: 'Instantly terminate all active sessions for "svc-database" and expire directory password.', mitigated: false },
      { id: 'act-2', name: 'Quarantine IP 185.220.101.4', desc: 'Update edge firewall policies to block outbound communication to the target exit node.', mitigated: false },
      { id: 'act-3', name: 'Database Session Terminate', desc: 'Kill active query engines and transactions associated with Vault token vault-session-812.', mitigated: false }
    ]
  },
  {
    id: 'INC-2026-082',
    title: 'Anomalous PowerShell Execution & Ransomware Triage',
    severity: 'high',
    risk_score: 82,
    status: 'Open',
    timestamp: '2026-07-16T14:15:30Z',
    agents: ['Endpoint Agent', 'Threat Intelligence Agent'],
    explanation: 'Identity and Endpoint telemetry detected a suspicious process execution command string executing under bypass mode. The command downloaded a binary whose hash correlates with ransomware payloads observed in recent industry campaigns.',
    timeline: [
      { id: 't6', source: 'edr', time: '14:15:30', title: 'Suspicious PowerShell Spawn', desc: 'powershell.exe executed with ExecutionPolicy Bypass to run C:\\Users\\Public\\update.ps1.' },
      { id: 't7', source: 'edr', time: '14:15:45', title: 'External Binary Download', desc: 'Process initiated curl request downloading executable payload.exe from temp site.' }
    ],
    mitre: ['Execution', 'Defense Evasion'],
    actions: [
      { id: 'act-4', name: 'Quarantine Host via EDR', desc: 'Isolate host terminal-user-412 at the agent level to halt lateral network propagation.', mitigated: false },
      { id: 'act-5', name: 'Revoke AD Session tokens', desc: 'Terminate Kerberos ticket-granting tokens for current session users on target node.', mitigated: false }
    ]
  }
];

const SAMPLE_AGENTS = [
  { name: 'Identity Agent', status: 'Online', verified_events: 142, alerts_raised: 4, type: 'IAM/PAM Analysis' },
  { name: 'Endpoint Agent', status: 'Online', verified_events: 894, alerts_raised: 2, type: 'EDR Sysmon Telemetry' },
  { name: 'Database Agent', status: 'Online', verified_events: 312, alerts_raised: 1, type: 'Database Audits' },
  { name: 'Network Agent', status: 'Online', verified_events: 1042, alerts_raised: 1, type: 'NetFlow & Zeek Logs' },
  { name: 'Threat Intelligence Agent', status: 'Online', verified_events: 75, alerts_raised: 2, type: 'IOC Feed Correlator' },
  { name: 'Policy Agent', status: 'Online', verified_events: 512, alerts_raised: 1, type: 'GPO & Access Controls' }
];

const CHART_DATA = [
  { time: '14:00', risk: 10, events: 150 },
  { time: '14:05', risk: 12, events: 180 },
  { time: '14:10', risk: 55, events: 210 },
  { time: '14:11', risk: 70, events: 250 },
  { time: '14:12', risk: 85, events: 320 },
  { time: '14:14', risk: 95, events: 400 },
  { time: '14:15', risk: 95, events: 420 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'investigator' | 'agents' | 'simulator'>('overview');
  const [logs, setLogs] = useState<any[]>(SAMPLE_LOGS);
  const [incidents, setIncidents] = useState<any[]>(SAMPLE_INCIDENTS);
  const [agents, setAgents] = useState<any[]>(SAMPLE_AGENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-2026-081');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simMessage, setSimMessage] = useState<string>('');
  const [selectedRawPayload, setSelectedRawPayload] = useState<any | null>(null);

  // Fetch data from backend with fallback
  const refreshData = async () => {
    try {
      // Fetch logs
      const logsRes = await fetch(`${API_BASE}/telemetry`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData && logsData.length > 0) setLogs(logsData);
      }

      // Fetch incidents
      const incRes = await fetch(`${API_BASE}/incidents`);
      if (incRes.ok) {
        const incData = await incRes.json();
        if (incData && incData.length > 0) setIncidents(incData);
      }

      // Fetch agents
      const agentRes = await fetch(`${API_BASE}/agents/status`);
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        if (agentData && agentData.length > 0) setAgents(agentData);
      }
    } catch (e) {
      console.log('Using local mock data fallback. Backend is not reachable.');
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerSimulation = async (scenario: string) => {
    setIsSimulating(true);
    setSimMessage('Initializing agent correlation environment...');
    try {
      const response = await fetch(`${API_BASE}/simulator/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      if (response.ok) {
        const result = await response.json();
        setSimMessage(`Injected logs successfully! Correlating ${result.events_injected} events across domains...`);
        // Refresh instantly
        setTimeout(async () => {
          await refreshData();
          setIsSimulating(false);
          setSimMessage('');
          // Auto route to investigator / incidents
          setActiveTab('incidents');
        }, 1500);
      } else {
        throw new Error('Simulation endpoint failed');
      }
    } catch (err) {
      // Simulate locally
      console.log('Simulating locally');
      setTimeout(() => {
        if (scenario === 'insider_exfil') {
          // Add local logs
          const newLogs = [
            { event_id: 'sim-1', source: 'iam', timestamp: new Date().toISOString(), message: 'Anomalous remote interactive login for user svc-database from IP 185.220.101.4' },
            { event_id: 'sim-2', source: 'policy', timestamp: new Date().toISOString(), message: 'Security Policy Alert: Access attempt outside standard working hours (02:10 AM UTC)' },
            { event_id: 'sim-3', source: 'iam', timestamp: new Date().toISOString(), message: 'Privilege elevation requested: user svc-database elevated to DBA Role via vault-session-812' },
            { event_id: 'sim-4', source: 'database', timestamp: new Date().toISOString(), message: 'Anomalous Query Executed: SELECT * FROM customer_credit_cards LIMIT 1000000; (Role: DBA)' },
            { event_id: 'sim-5', source: 'network', timestamp: new Date().toISOString(), message: 'Data egress warning: Outbound TCP session to 185.220.101.4 transferred 4.8 GB on port 443' }
          ];
          setLogs(prev => [...newLogs, ...prev]);
        } else if (scenario === 'ransomware') {
          const newLogs = [
            { event_id: 'sim-6', source: 'edr', timestamp: new Date().toISOString(), message: 'Suspicious process execution: powershell.exe -ExecutionPolicy Bypass -File C:\\Users\\Public\\update.ps1' },
            { event_id: 'sim-7', source: 'edr', timestamp: new Date().toISOString(), message: 'Ransomware threat pattern identified: file mass encryption initiated in folder /shared/bank_records' }
          ];
          setLogs(prev => [...newLogs, ...prev]);
        }
        setIsSimulating(false);
        setSimMessage('');
        setActiveTab('incidents');
      }, 1000);
    }
  };

  const handleActionClick = async (incidentId: string, actionId: string) => {
    try {
      const response = await fetch(`${API_BASE}/incidents/${incidentId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId })
      });
      if (response.ok) {
        refreshData();
      } else {
        throw new Error('Mitigation failed');
      }
    } catch (e) {
      // Local update fallback
      setIncidents(prev => prev.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            actions: inc.actions.map((act: any) => 
              act.id === actionId ? { ...act, mitigated: true } : act
            )
          };
        }
        return inc;
      }));
    }
  };

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'iam': return <User size={14} className="metric-icon cyan" />;
      case 'database': return <Database size={14} className="metric-icon orange" />;
      case 'edr': return <Server size={14} className="metric-icon purple" />;
      case 'network': return <Globe size={14} className="metric-icon cyan" />;
      default: return <Shield size={14} className="metric-icon" />;
    }
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield className="logo-icon" />
          <span className="logo-text">AGENTIC SOC</span>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={18} />
            Security Overview
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <AlertTriangle size={18} />
            Incidents Queue
            {incidents.filter(i => i.status !== 'Remediated').length > 0 && (
              <span className="badge critical" style={{ marginLeft: 'auto', padding: '1px 6px', fontSize: '10px' }}>
                {incidents.filter(i => i.status !== 'Remediated').length}
              </span>
            )}
          </button>

          <button 
            className={`nav-button ${activeTab === 'investigator' ? 'active' : ''}`}
            onClick={() => setActiveTab('investigator')}
          >
            <FileText size={18} />
            AI Investigator
          </button>

          <button 
            className={`nav-button ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            <Network size={18} />
            Agent Network
          </button>

          <button 
            className={`nav-button ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Play size={18} />
            Attack Simulator
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="agent-summary">
            <span className="agent-summary-title">Security Services</span>
            <div className="agent-status-mini">
              <span>Coordinating Engine</span>
              <span className="status-pill"><span className="status-indicator green"></span>Active</span>
            </div>
            <div className="agent-status-mini">
              <span>Threat Intel</span>
              <span className="status-pill"><span className="status-indicator green"></span>Connected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-title-area">
            <h1>Agentic SOC Copilot</h1>
            <div className="header-meta">
              <span className="pulse-animation" style={{ display: 'inline-block', marginRight: '8px' }}></span>
              COPILOT MONITOR ACTIVE • CORRELATING enterprisewide events
            </div>
          </div>
          <div className="header-actions">
            <button className="action-primary-btn" onClick={refreshData} style={{ background: 'rgba(23,34,55,0.8)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <RefreshCw size={14} />
              Reload Telemetry
            </button>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="content-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Metrics Row */}
              <div className="metrics-grid">
                <div className="cyber-card metric-card glow-cyan">
                  <div className="metric-header">
                    <span className="metric-title">Ingested Events</span>
                    <Terminal size={18} className="metric-icon cyan" />
                  </div>
                  <span className="metric-value">{logs.length}</span>
                </div>
                
                <div className="cyber-card metric-card glow-red">
                  <div className="metric-header">
                    <span className="metric-title">Active Incidents</span>
                    <AlertOctagon size={18} className="metric-icon red" />
                  </div>
                  <span className="metric-value">{incidents.filter(i => i.status !== 'Remediated').length}</span>
                </div>
                
                <div className="cyber-card metric-card glow-cyan">
                  <div className="metric-header">
                    <span className="metric-title">Max Threat Level</span>
                    <AlertTriangle size={18} className="metric-icon red" />
                  </div>
                  <span className="metric-value" style={{ color: 'var(--accent-red)' }}>
                    {incidents.length > 0 ? Math.max(...incidents.map(i => i.risk_score)) : 0}%
                  </span>
                </div>

                <div className="cyber-card metric-card glow-cyan">
                  <div className="metric-header">
                    <span className="metric-title">SOC Agents Online</span>
                    <Network size={18} className="metric-icon green" />
                  </div>
                  <span className="metric-value" style={{ color: 'var(--accent-green)' }}>
                    {agents.filter(a => a.status === 'Online').length}/{agents.length}
                  </span>
                </div>
              </div>

              {/* Chart & Log Feed Grid */}
              <div className="dashboard-grid-2x1">
                {/* Risk Trend Chart */}
                <div className="cyber-card">
                  <span className="section-title">
                    <Activity size={16} className="metric-icon cyan" />
                    Threat Correlation Level over Time
                  </span>
                  <div style={{ width: '100%', height: '230px' }}>
                    <ResponsiveContainer>
                      <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 45, 74, 0.4)" />
                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        <Area type="monotone" dataKey="risk" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorRisk)" name="Threat Score" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Telemetry Stream */}
                <div className="cyber-card">
                  <span className="section-title">
                    <Terminal size={16} className="metric-icon cyan" />
                    Raw Event Stream Ticker
                  </span>
                  <div className="log-ticker-container">
                    {logs.map((log, index) => (
                      <div key={log.event_id || index} className="log-entry" onClick={() => setSelectedRawPayload(log)}>
                        <span className="log-time">{log.timestamp ? log.timestamp.substring(11, 19) : new Date().toLocaleTimeString()}</span>
                        <span className={`log-source ${log.source}`}>{log.source}</span>
                        <span className="log-message">{log.message || `Raw event ingested ID: ${log.event_id}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: INCIDENTS QUEUE */}
          {activeTab === 'incidents' && (
            <div className="cyber-card">
              <span className="section-title">
                <AlertTriangle size={18} className="metric-icon red" />
                Active Correlated Incidents
              </span>
              <div className="incident-table-wrapper">
                <table className="incident-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Incident ID</th>
                      <th>Name / Threat Summary</th>
                      <th>Risk Score</th>
                      <th>Triggered Agents</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr 
                        key={inc.id} 
                        className={`incident-row ${selectedIncidentId === inc.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedIncidentId(inc.id);
                          setActiveTab('investigator');
                        }}
                      >
                        <td>
                          <span className={`badge ${inc.severity}`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inc.id}</td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{inc.title}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: inc.risk_score > 85 ? 'var(--accent-red)' : 'var(--accent-orange)' }}>
                              {inc.risk_score}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {inc.agents.map((ag: string) => (
                              <span key={ag} style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '3px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)' }}>
                                {ag.replace(' Agent', '')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="status-pill">
                            <span className={`status-indicator ${inc.status === 'Remediated' ? 'green' : 'red'}`}></span>
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AI INVESTIGATOR */}
          {activeTab === 'investigator' && (
            <div className="detail-grid">
              {/* Left Column: List of Incidents */}
              <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="section-title">Incident Context</span>
                {incidents.map(inc => (
                  <div 
                    key={inc.id} 
                    onClick={() => setSelectedIncidentId(inc.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: selectedIncidentId === inc.id ? 'var(--accent-cyan)' : 'var(--border-color)',
                      backgroundColor: selectedIncidentId === inc.id ? 'rgba(0, 240, 255, 0.04)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className={`badge ${inc.severity}`} style={{ fontSize: '9px' }}>{inc.severity}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{inc.id}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                      {inc.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Risk: <b style={{ color: inc.risk_score > 85 ? 'var(--accent-red)' : 'var(--accent-orange)' }}>{inc.risk_score}%</b></span>
                      <span>{inc.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Deep Analysis Details */}
              <div className="cyber-card">
                <div className="detail-card-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 className="detail-card-title">{selectedIncident.title}</h2>
                    <span className={`badge ${selectedIncident.severity}`}>{selectedIncident.severity}</span>
                  </div>
                  <div className="detail-meta-row" style={{ marginTop: '8px' }}>
                    <span>ID: <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{selectedIncident.id}</b></span>
                    <span>Risk: <b style={{ color: 'var(--accent-red)' }}>{selectedIncident.risk_score}%</b></span>
                    <span>Status: <b>{selectedIncident.status}</b></span>
                  </div>
                </div>

                {/* AI Explanation Box */}
                <div className="ai-reasoning-box">
                  <div className="ai-reasoning-title">
                    <Shield size={16} />
                    <span>Coordinator AI Reasoning Explanation</span>
                  </div>
                  <p className="ai-reasoning-text">{selectedIncident.explanation}</p>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div style={{ marginTop: '24px' }}>
                  <span className="section-title" style={{ fontSize: '14px' }}>
                    <Network size={14} className="metric-icon red" />
                    MITRE ATT&CK Mapping
                  </span>
                  <div className="mitre-container">
                    <div className="mitre-column">
                      <span className="mitre-col-title">Initial Access</span>
                      <div className={`mitre-cell ${selectedIncident.mitre.includes('Initial Access') ? 'active' : ''}`}>
                        Valid Accounts (T1078)
                      </div>
                    </div>
                    <div className="mitre-column">
                      <span className="mitre-col-title">Privilege Elev</span>
                      <div className={`mitre-cell ${selectedIncident.mitre.includes('Privilege Escalation') ? 'active' : ''}`}>
                        Token Manipulation (T1134)
                      </div>
                    </div>
                    <div className="mitre-column">
                      <span className="mitre-col-title">Cred Access</span>
                      <div className={`mitre-cell ${selectedIncident.mitre.includes('Credential Access') ? 'active' : ''}`}>
                        Unsecured Credentials (T1552)
                      </div>
                      <div className={`mitre-cell ${selectedIncident.mitre.includes('Execution') ? 'active' : ''}`}>
                        PowerShell Execute (T1059)
                      </div>
                    </div>
                    <div className="mitre-column">
                      <span className="mitre-col-title">Exfiltration</span>
                      <div className={`mitre-cell ${selectedIncident.mitre.includes('Exfiltration') ? 'active' : ''}`}>
                        Exfil Over Web Service (T1567)
                      </div>
                      <div className={`mitre-cell ${selectedIncident.mitre.includes('Defense Evasion') ? 'active' : ''}`}>
                        Obfuscated Files (T1027)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ marginTop: '24px' }}>
                  <span className="section-title" style={{ fontSize: '14px' }}>
                    <Terminal size={14} className="metric-icon cyan" />
                    Correlated Attack Campaign Timeline
                  </span>
                  <div className="timeline-list">
                    {selectedIncident.timeline.map((item: any) => (
                      <div key={item.id} className="timeline-item">
                        <span className={`timeline-marker ${item.source}`}></span>
                        <div className="timeline-header">
                          <span className="timeline-title">
                            {getSourceIcon(item.source)} <span style={{ marginLeft: '4px' }}>{item.title}</span>
                          </span>
                          <span className="timeline-time">{item.time}</span>
                        </div>
                        <div className="timeline-desc">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mitigation & Response Controls */}
                <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <span className="section-title" style={{ fontSize: '14px' }}>
                    <CheckCircle size={14} className="metric-icon green" />
                    AI Recommended Response Mitigation Actions
                  </span>
                  <div className="action-box">
                    {selectedIncident.actions.map((act: any) => (
                      <div key={act.id} className="action-card">
                        <div className="action-info">
                          <span className="action-name">{act.name}</span>
                          <span className="action-desc">{act.desc}</span>
                        </div>
                        <button 
                          className={`action-btn ${act.mitigated ? 'mitigated' : ''}`}
                          onClick={() => handleActionClick(selectedIncident.id, act.id)}
                          disabled={act.mitigated}
                        >
                          {act.mitigated ? 'Mitigated' : 'Run Action'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AGENT NETWORK */}
          {activeTab === 'agents' && (
            <>
              <div className="cyber-card">
                <span className="section-title">
                  <Network size={16} className="metric-icon cyan" />
                  Collaborative Multi-Agent Architecture
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '800px' }}>
                  Our copilot orchestrates specialized AI agents that review telemetry in parallel. When high-risk anomalies match correlated attack behaviors, the findings are dispatched to the Coordinator Agent which generates the incident reports.
                </p>
                
                <div className="agent-grid">
                  {agents.map((ag) => (
                    <div key={ag.name} className="cyber-card agent-card glow-cyan">
                      <div className="agent-card-header">
                        <span className="agent-name">{ag.name}</span>
                        <span className="status-pill">
                          <span className="status-indicator green"></span>{ag.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                        {ag.type}
                      </span>
                      <p className="agent-desc">
                        Monitors and normalizes telemetry data, running isolated risk calculations against user behavior baselines.
                      </p>
                      <div className="agent-stats">
                        <div>
                          <span className="agent-stat-label">Events Processed</span>
                          <div className="agent-stat-value">{ag.verified_events}</div>
                        </div>
                        <div>
                          <span className="agent-stat-label">Anomalies Detected</span>
                          <div className="agent-stat-value">{ag.alerts_raised}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="agent-flow-connector">
                    <div className="agent-flow-arrow"></div>
                  </div>

                  <div className="cyber-card coordinator-panel glow-purple" style={{ border: '1px solid rgba(168,85,247,0.4)' }}>
                    <div className="agent-card-header">
                      <span className="agent-name" style={{ color: '#c084fc' }}>Coordinator Agent (XAI Engine)</span>
                      <span className="status-pill">
                        <span className="status-indicator red"></span>Synthesizing Alerts
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>CORRELATION & REASONING LAYER</span>
                    <p className="agent-desc" style={{ marginTop: '8px' }}>
                      Aggregates anomalies from all specialized agents, builds the MITRE ATT&CK campaign graphs, executes explainable reasoning, and provides remediation actions to the human analyst.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: ATTACK SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="cyber-card">
              <span className="section-title">
                <Play size={18} className="metric-icon cyan" />
                Banking Security Alert Simulation Panel
              </span>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '800px' }}>
                Inject realistic attack scenarios into the system. The agents will process the raw telemetry logs in real-time, trigger the risk scoring engine, and construct a correlated incident dashboard view.
              </p>

              {isSimulating && (
                <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent-cyan)', padding: '16px', borderRadius: '6px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <RefreshCw className="logo-icon" style={{ animation: 'spin 2s linear infinite' }} />
                  <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{simMessage}</span>
                </div>
              )}

              <div className="scenario-grid">
                {/* Scenario 1 */}
                <div className="cyber-card scenario-card glow-cyan">
                  <div className="scenario-details">
                    <span className="scenario-name">Scenario 1: Insiders Privileged Access Misuse</span>
                    <p className="scenario-desc">Simulates a malicious employee using a compromised database service account out of hours, elevating roles, dumping the credit cards database table, and transferring files over secure TLS tunnel.</p>
                    <div className="scenario-steps">
                      <span className="scenario-step"><CornerDownRight size={10} /> 1. Anomalous IAM Interactive Login (Tor exit IP)</span>
                      <span className="scenario-step"><CornerDownRight size={10} /> 2. Out-of-hours PAM request for DB Role elevation</span>
                      <span className="scenario-step"><CornerDownRight size={10} /> 3. DB select statement reading 1M credit records</span>
                      <span className="scenario-step"><CornerDownRight size={10} /> 4. Large NetFlow egress payload output to external host</span>
                    </div>
                  </div>
                  <button 
                    className="sim-button"
                    onClick={() => triggerSimulation('insider_exfil')}
                    disabled={isSimulating}
                  >
                    Inject Insider Exfil Campaign
                  </button>
                </div>

                {/* Scenario 2 */}
                <div className="cyber-card scenario-card glow-cyan">
                  <div className="scenario-details">
                    <span className="scenario-name">Scenario 2: Ransomware Infection Execution</span>
                    <p className="scenario-desc">Simulates a compromised workstation terminal executing obfuscated PowerShell command strings, downloading unauthorized external payloads, and running mass local directory lock encryption loops.</p>
                    <div className="scenario-steps">
                      <span className="scenario-step"><CornerDownRight size={10} /> 1. User downloads suspicious zip archive</span>
                      <span className="scenario-step"><CornerDownRight size={10} /> 2. Bypass PowerShell execution triggered by background daemon</span>
                      <span className="scenario-step"><CornerDownRight size={10} /> 3. Mass directory file re-writes and encryption lock creation</span>
                    </div>
                  </div>
                  <button 
                    className="sim-button"
                    onClick={() => triggerSimulation('ransomware')}
                    disabled={isSimulating}
                  >
                    Inject Ransomware Campaign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RAW PAYLOAD INSPECTOR MODAL */}
      {selectedRawPayload && (
        <div className="modal-overlay" onClick={() => setSelectedRawPayload(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="section-title" style={{ margin: 0 }}>
                <Terminal size={16} className="metric-icon cyan" />
                Raw Telemetry Event Details
              </span>
              <button className="modal-close-btn" onClick={() => setSelectedRawPayload(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div><b>Event ID:</b> <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedRawPayload.event_id}</span></div>
                <div><b>Source Stream:</b> <span className={`badge ${selectedRawPayload.source}`} style={{ textTransform: 'uppercase' }}>{selectedRawPayload.source}</span></div>
                <div><b>Timestamp:</b> <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedRawPayload.timestamp}</span></div>
                <div><b>Normalized Message:</b> <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{selectedRawPayload.message || 'No description template available'}</div></div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>RAW PAYLOAD LOG STRING:</div>
              <pre className="raw-payload-box">
                {JSON.stringify({
                  event_id: selectedRawPayload.event_id,
                  source: selectedRawPayload.source,
                  timestamp: selectedRawPayload.timestamp,
                  payload: {
                    ip_address: selectedRawPayload.source === 'iam' || selectedRawPayload.source === 'network' ? '185.220.101.4' : '10.22.41.9',
                    user_principal: selectedRawPayload.source === 'iam' ? 'svc-database' : 'admin-ad',
                    machine_identifier: 'workstation-win-82192',
                    execution_parameters: selectedRawPayload.source === 'edr' ? '-Bypass -File update.ps1' : 'None',
                    database_schema: selectedRawPayload.source === 'database' ? 'customer_records' : 'None'
                  }
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
