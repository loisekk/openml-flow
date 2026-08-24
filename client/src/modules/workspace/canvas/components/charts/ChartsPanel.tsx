// src/modules/workspace/components/charts/ChartsPanel.tsx
import { useWorkflowStore } from '../../../store/workflowStore';
import type { ChartPayload } from '../../../store/workflowStore';
import ChartRenderer from './ChartRenderer';

export default function ChartsPanel({ nodeId }: { nodeId: string }) {
  const nodeCharts = useWorkflowStore((s) => s.nodeCharts?.[nodeId]);
  const charts = nodeCharts ?? [];

  if (charts.length === 0) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#8B9BB4', fontSize: 13 }}>
        📊 No charts yet — execute this node to generate visualizations.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', padding: 4 }}>
      {charts.map((c) => (
        <div key={c.type} style={{ border: '1px solid #18253A', borderRadius: 10, background: '#0A1426', padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F4F7FB', marginBottom: 10 }}>{c.title}</div>
          <ChartRenderer chart={c} />
        </div>
      ))}
    </div>
  );
}