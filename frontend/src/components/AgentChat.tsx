import React, { useState, useRef, useEffect } from 'react';
import type { AgentMessage } from '../types';
import { chatWithAgent } from '../hooks/useApi';

interface AgentDef { id: string; name: string; role: string; status: 'active' | 'idle' | 'busy'; }

const AGENTS: AgentDef[] = [
  { id: '1', name: 'SOC Coordinator', role: 'Orchestrator',       status: 'active' },
  { id: '2', name: 'IAM Agent',       role: 'Identity & Access',  status: 'active' },
  { id: '3', name: 'EDR Agent',       role: 'Endpoint Detection', status: 'active' },
  { id: '4', name: 'Network Agent',   role: 'Network Monitor',    status: 'busy'   },
  { id: '5', name: 'Firewall Agent',  role: 'Perimeter Security', status: 'idle'   },
  { id: '6', name: 'PAM Agent',       role: 'Privileged Access',  status: 'active' },
];

const STATUS_COLOR: Record<string, string> = {
  active: 'var(--teal)',
  idle:   'var(--text-muted)',
  busy:   'var(--medium)',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const INITIAL: AgentMessage = {
  id:        'init',
  role:      'assistant',
  content:   'SOC Copilot online. I am monitoring 6 security data sources across your banking infrastructure. Ask me about current threats, risk scores, agent status, or recommendations.',
  timestamp: new Date().toISOString(),
  agent:     'SOC Coordinator',
};

export const AgentChat: React.FC = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([INITIAL]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: AgentMessage = {
      id:        Date.now().toString(),
      role:      'user',
      content:   input,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithAgent(messages, input);
      setMessages(prev => [
        ...prev,
        { id: `${Date.now()}r`, role: 'assistant', content: reply, timestamp: new Date().toISOString(), agent: 'SOC Coordinator' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Agent Status Bar */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
        {AGENTS.map(a => {
          const sc = STATUS_COLOR[a.status];
          return (
            <div key={a.id} className="agent-status">
              <div
                className="agent-status__dot"
                style={{
                  background:  sc,
                  boxShadow:   a.status !== 'idle' ? `0 0 6px ${sc}` : 'none',
                }}
              />
              <div>
                <div className="agent-status__name">{a.name}</div>
                <div className="agent-status__role">{a.role}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(m => (
          <div key={m.id} className={`chat-msg chat-msg--${m.role}`}>
            <div className="chat-msg__avatar">{m.role === 'user' ? '👤' : '🤖'}</div>
            <div>
              {m.agent && (
                <div style={{ fontSize: '0.7rem', color: 'var(--cyan)', marginBottom: 4 }}>
                  {m.agent}
                </div>
              )}
              <div className="chat-msg__bubble">{m.content}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {fmtTime(m.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg">
            <div className="chat-msg__avatar">🤖</div>
            <div className="chat-msg__bubble" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Analysing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Ask about threats, risk, agents, recommendations..."
        />
        <button className="btn btn--primary" onClick={send} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};
