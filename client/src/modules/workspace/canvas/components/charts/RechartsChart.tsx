// src/modules/workspace/components/charts/RechartsChart.tsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, LineChart, Line,
} from 'recharts';
import { useWorkflowStore } from '../../../store/workflowStore';
import type { ChartPayload } from '../../../store/workflowStore';

const T = {
  orange: '#FF7A00', cyan: '#06B6D4', purple: '#8B5CF6',
  grid: '#18253A', axis: '#8B9BB4', text: '#F4F7FB',
  tooltip: { background: '#0A1426', border: '1px solid #18253A', borderRadius: 8, color: '#F4F7FB', fontSize: 12 },
};

export default function RechartsChart({ chart }: { chart: ChartPayload }) {
  const d = chart.data ?? {};

  if (chart.type === 'scatter') {
    const points: any[] = (d.points ?? []).map(([x, y]: [number, number]) => ({ x, y }));
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
          <XAxis dataKey="x" name={d.xColumn} stroke={T.axis} tick={{ fontSize: 10 }} type="number" domain={['auto', 'auto']} label={{ value: d.xColumn, position: 'insideBottom', offset: -15, fill: T.axis, fontSize: 11 }} />
          <YAxis dataKey="y" name={d.yColumn} stroke={T.axis} tick={{ fontSize: 10 }} type="number" domain={['auto', 'auto']} />
          <Tooltip contentStyle={T.tooltip} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={points} fill={T.cyan} fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === 'line') {
    const points: any[] = (d.points ?? []).map(([x, y]: [number, number]) => ({ x, y }));
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
          <XAxis dataKey="x" stroke={T.axis} tick={{ fontSize: 10 }} type="number" domain={['auto', 'auto']} />
          <YAxis stroke={T.axis} tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={T.tooltip} />
          <Line type="monotone" dataKey="y" stroke={T.orange} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // histogram + bar
  const data: any[] = (d.categories ?? []).map((c: string, i: number) => ({ name: String(c), value: d.values?.[i] ?? 0 }));
  const color = chart.type === 'histogram' ? T.purple : T.cyan;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
        <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
        <XAxis dataKey="name" stroke={T.axis} tick={{ fontSize: 9 }} interval={0} angle={-40} textAnchor="end" height={60} />
        <YAxis stroke={T.axis} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={T.tooltip} cursor={{ fill: 'rgba(139,155,180,0.08)' }} />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}