import React, { useRef, useEffect } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'user' | 'endpoint' | 'database' | 'service';
  x: number;
  y: number;
  eventCount: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
  isMalicious: boolean;
}

interface Props {
  users: { user_id: string; event_count: number }[];
  endpoints: { endpoint: string; event_count: number }[];
}

const TYPE_COLORS = {
  user: '#3498db',
  endpoint: '#00e5b0',
  database: '#e74c3c',
  service: '#f39c12',
};

export const NetworkTopology: React.FC<Props> = ({ users, endpoints }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    // Build nodes
    const nodes: Node[] = [];
    const topUsers = users.slice(0, 6);
    const topEndpoints = endpoints.slice(0, 6);

    // Place users on the left arc
    topUsers.forEach((u, i) => {
      const angle = (-Math.PI / 3) + (i / Math.max(1, topUsers.length - 1)) * (2 * Math.PI / 3);
      nodes.push({
        id: u.user_id,
        label: u.user_id,
        type: 'user',
        x: W * 0.22 + Math.cos(angle) * W * 0.12,
        y: H * 0.5 + Math.sin(angle) * H * 0.32,
        eventCount: u.event_count,
      });
    });

    // Place endpoints on the right arc
    topEndpoints.forEach((ep, i) => {
      const angle = (-Math.PI / 3) + (i / Math.max(1, topEndpoints.length - 1)) * (2 * Math.PI / 3);
      nodes.push({
        id: ep.endpoint,
        label: ep.endpoint.replace('/api/', ''),
        type: 'endpoint',
        x: W * 0.78 + Math.cos(angle) * W * 0.12,
        y: H * 0.5 + Math.sin(angle) * H * 0.32,
        eventCount: ep.event_count,
      });
    });

    // Central SOC node
    nodes.push({
      id: 'soc-core',
      label: 'SOC Core',
      type: 'service',
      x: W * 0.5,
      y: H * 0.5,
      eventCount: 0,
    });

    // DB node
    nodes.push({
      id: 'database',
      label: 'Database',
      type: 'database',
      x: W * 0.5,
      y: H * 0.85,
      eventCount: 0,
    });

    // Build edges
    const edges: Edge[] = [];
    topUsers.forEach(u => {
      edges.push({ from: u.user_id, to: 'soc-core', weight: u.event_count, isMalicious: u.event_count > 20 });
    });
    topEndpoints.forEach(ep => {
      edges.push({ from: 'soc-core', to: ep.endpoint, weight: ep.event_count, isMalicious: ep.event_count > 20 });
    });
    edges.push({ from: 'soc-core', to: 'database', weight: 10, isMalicious: false });

    const nodeMap: Record<string, Node> = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    let frame = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Draw edges with animated pulse
      edges.forEach(edge => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];
        if (!from || !to) return;

        const color = edge.isMalicious ? 'rgba(255,59,107,0.5)' : 'rgba(0,229,176,0.2)';
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, Math.min(edge.weight / 10, 3));
        ctx.stroke();

        // Animated dot traveling along edge
        const t = ((frame * 0.008 + edge.weight * 0.01) % 1);
        const px = from.x + (to.x - from.x) * t;
        const py = from.y + (to.y - from.y) * t;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = edge.isMalicious ? '#ff3b6b' : '#00e5b0';
        ctx.shadowColor = edge.isMalicious ? '#ff3b6b' : '#00e5b0';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw nodes
      nodes.forEach(node => {
        const color = TYPE_COLORS[node.type];
        const radius = node.type === 'service' ? 22 : node.type === 'database' ? 18 : 14;

        // Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${color}20`;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${color}40`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = `${radius * 0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons: Record<string, string> = { user: '👤', endpoint: '🔗', database: '🗄️', service: '🧠' };
        ctx.fillText(icons[node.type] || '●', node.x, node.y);

        // Label
        ctx.fillStyle = '#a8b4c4';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 14);

        if (node.eventCount > 0) {
          ctx.fillStyle = '#6b7a8d';
          ctx.font = '9px Inter, sans-serif';
          ctx.fillText(`${node.eventCount} events`, node.x, node.y + radius + 26);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [users, endpoints]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 400,
        borderRadius: 8,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    />
  );
};

export default NetworkTopology;
