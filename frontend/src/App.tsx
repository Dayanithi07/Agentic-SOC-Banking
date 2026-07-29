import React, { useState, useCallback } from 'react';
import { Sidebar }        from './components/Sidebar';
import { Header }         from './components/Header';
import { Dashboard }      from './pages/Dashboard';
import { AIAgents }       from './pages/AIAgents';
import { Investigations } from './pages/Investigations';
import { Help }           from './pages/Help';
import { NetworkMap }      from './pages/NetworkMap';
import { TargetStore }     from './pages/TargetStore';
import { fetchRunCycle }   from './hooks/useApi';
import { useTelemetryWebSocket } from './hooks/useTelemetryWebSocket';
import type { TelemetryEvent } from './types';

export default function App() {
  const [page,    setPage]    = useState('dashboard');
  const [events,  setEvents]  = useState<TelemetryEvent[]>([]);
  const [running, setRunning] = useState(false);

  useTelemetryWebSocket({
    onEvent: (ev) => setEvents(prev => [ev, ...prev].slice(0, 200)),
  });

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
      case 'dashboard':      return <Dashboard onNavigate={(p) => setPage(p)} />;
      case 'investigations': return <Investigations />;
      case 'agents':         return <AIAgents />;
      case 'network':         return <NetworkMap />;
      case 'store':           return <TargetStore />;
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
