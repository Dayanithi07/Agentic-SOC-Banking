import React, { useState, useCallback } from 'react';
import { Sidebar }        from './components/Sidebar';
import { Header }         from './components/Header';
import { Dashboard }      from './pages/Dashboard';
import { LiveAlerts }     from './pages/LiveAlerts';
import { AIAgents }       from './pages/AIAgents';
import { Analytics }      from './pages/Analytics';
import { ThreatHunt }     from './pages/ThreatHunt';
import { Investigations } from './pages/Investigations';
import { Settings }       from './pages/Settings';
import { Help }           from './pages/Help';
import { generateEvents, fetchRunCycle } from './hooks/useApi';
import type { TelemetryEvent } from './types';

export default function App() {
  const [page,    setPage]    = useState('dashboard');
  const [events,  setEvents]  = useState<TelemetryEvent[]>(() => generateEvents(24));
  const [running, setRunning] = useState(false);

  const criticalCount = events.filter(e => e.severity === 'critical').length;

  const runCycle = useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      const { events: newEvts } = await fetchRunCycle();
      setEvents(prev => [...newEvts, ...prev].slice(0, 200));
    } finally {
      setRunning(false);
    }
  }, [running]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard />;
      case 'alerts':         return <LiveAlerts />;
      case 'agents':         return <AIAgents />;
      case 'analytics':      return <Analytics />;
      case 'hunt':           return <ThreatHunt />;
      case 'investigations': return <Investigations />;
      case 'settings':       return <Settings />;
      case 'help':           return <Help />;
      default:
        return (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚧</div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
              {page.charAt(0).toUpperCase() + page.slice(1)} &mdash; Coming Soon
            </h2>
            <button className="btn btn--ghost" onClick={() => setPage('dashboard')}>
              &larr; Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="layout">
      <div className="layout__header">
        <Header liveCount={events.length} onRunCycle={runCycle} running={running} />
      </div>
      <div className="layout__sidebar">
        <Sidebar active={page} onNav={setPage} criticalCount={criticalCount} />
      </div>
      <main className="layout__main">
        {renderPage()}
      </main>
    </div>
  );
}
