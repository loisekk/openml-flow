// src/modules/workspace/components/charts/ChartRenderer.tsx
import { useWorkflowStore } from '../../../store/workflowStore';
import type { ChartPayload } from '../../../store/workflowStore';
import CorrelationHeatmap from './CorrelationHeatmap';
import RechartsChart from './RechartsChart';

export default function ChartRenderer({ chart }: { chart: ChartPayload }) {
  switch (chart.type) {
    case 'heatmap':
      return <CorrelationHeatmap chart={chart} />;
    case 'bar':
    case 'histogram':
    case 'scatter':
    case 'line':
      return <RechartsChart chart={chart} />;
    default:
      return <div style={{ color: '#8B9BB4', padding: 16 }}>Unsupported chart type: {String(chart.type)}</div>;
  }
}