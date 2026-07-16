export interface TelemetryEvent {
  id: string;
  source: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  user?: string;
  description: string;
  risk_score: number;
  ai_explanation?: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent?: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy';
}

export interface DashboardStats {
  total_events: number;
  critical_alerts: number;
  active_agents: number;
  threats_resolved: number;
  avg_risk_score: number;
  events_last_hour: number;
}
