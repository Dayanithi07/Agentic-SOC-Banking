import { useEffect, useRef, useCallback, useState } from 'react';
import type { TelemetryEvent } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/telemetry';

export { API_BASE, WS_URL };

export function mapRawToEvent(raw: Record<string, unknown>): TelemetryEvent | null {
  if (!raw.event_type && !raw.event_id) return null;
  return {
    id: (raw.event_id || raw.id || `ws-${Date.now()}`) as string,
    source: (raw.source || 'unknown') as string,
    event_type: (raw.event_type || 'unknown') as string,
    severity: (raw.severity || 'info') as TelemetryEvent['severity'],
    timestamp: (raw.timestamp || new Date().toISOString()) as string,
    user: (raw.user_id || raw.user) as string | undefined,
    description: (raw.mitre_technique || raw.event_type || '') as string,
    risk_score: (raw.risk_score ?? (
      raw.severity === 'critical' ? 90 :
      raw.severity === 'high' ? 70 :
      raw.severity === 'medium' ? 45 : 20
    )) as number,
    ai_explanation: raw.mitre_tactic
      ? `${raw.mitre_tactic}: ${raw.mitre_technique || ''}`
      : undefined,
    status: 'new',
  };
}

export interface WebSocketMessage {
  type: 'event' | 'incident' | 'agent_activity' | 'stats_update';
  data: Record<string, unknown>;
}

export interface UseTelemetryWebSocketOptions {
  onEvent?: (event: TelemetryEvent) => void;
  onIncident?: (incident: Record<string, unknown>) => void;
  onAgentActivity?: (activity: Record<string, unknown>) => void;
  onStats?: (stats: Record<string, unknown>) => void;
}

export function useTelemetryWebSocket(options: UseTelemetryWebSocketOptions = {}) {
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('offline');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    if (wsRef.current) {
      const prev = wsRef.current;
      wsRef.current = null;
      if (prev.readyState < 2) prev.close();
    }

    try {
      setStatus('connecting');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current && wsRef.current === ws) setStatus('live');
      };

      ws.onmessage = (msg) => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        try {
          const parsed: WebSocketMessage = JSON.parse(msg.data);
          const { type, data } = parsed;
          if (type === 'event') {
            const ev = mapRawToEvent(data);
            if (ev) optionsRef.current.onEvent?.(ev);
          } else if (type === 'incident') {
            optionsRef.current.onIncident?.(data);
          } else if (type === 'agent_activity') {
            optionsRef.current.onAgentActivity?.(data);
          } else if (type === 'stats_update') {
            optionsRef.current.onStats?.(data);
          } else {
            const ev = mapRawToEvent(data);
            if (ev) optionsRef.current.onEvent?.(ev);
          }
        } catch { /* ignore malformed */ }
      };

      ws.onerror = () => {
        if (mountedRef.current && wsRef.current === ws) setStatus('offline');
      };

      ws.onclose = () => {
        if (!mountedRef.current || wsRef.current !== ws) return;
        setStatus('offline');
        reconnectRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 5000);
      };
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(connect, 300);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      if (ws && ws.readyState < 2) ws.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { status, reconnect: connect };
}
