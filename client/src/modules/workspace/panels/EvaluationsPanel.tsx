// client/src/modules/workspace/panels/EvaluationsPanel.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useWorkflowStore } from '../store/workflowStore';

export default function EvaluationsPanel() {
  const { executionMetrics } = useWorkflowStore();

  if (!executionMetrics) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
        <span style={{ fontSize: '32px' }}>📊</span>
        <p style={{ margin: 0, fontSize: '15px' }}>No evaluation metrics yet</p>
        <p style={{ margin: 0, fontSize: '12px' }}>Add an Evaluation node and execute the workflow to see metrics here.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Accuracy', value: executionMetrics.accuracy || 0, fill: '#3B82F6' },
    { name: 'Precision', value: executionMetrics.precision || 0, fill: '#8B5CF6' },
    { name: 'Recall', value: executionMetrics.recall || 0, fill: '#14B8A6' },
    { name: 'F1 Score', value: executionMetrics.f1 || 0, fill: '#FF7A00' },
  ];

  const cm = executionMetrics.confusion_matrix || [];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px', background: 'var(--bg-primary)' }}>
      
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {chartData.map((metric) => (
          <div key={metric.name} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{metric.name}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: metric.fill }}>
              {(metric.value * 100).toFixed(2)}%
            </div>
          </div>
        ))}
        {executionMetrics.roc_auc && (
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>ROC-AUC</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#EC4899' }}>
              {executionMetrics.roc_auc.toFixed(4)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Chart */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', height: '400px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--text-primary)' }}>Model Performance</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#8A94A6" fontSize={12} />
              <YAxis domain={[0, 1]} stroke="#8A94A6" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: '#101727', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }} 
                formatter={(value) => [((Number(value) || 0) * 100).toFixed(2) + '%']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confusion Matrix */}
        {cm.length > 0 && (
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--text-primary)' }}>Confusion Matrix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cm.length}, 1fr)`, gap: '4px', maxWidth: '300px', margin: '0 auto' }}>
              {cm.map((row: number[], i: number) => (
                row.map((cell: number, j: number) => {
                  const maxVal = Math.max(...cm.flat());
                  const opacity = maxVal > 0 ? cell / maxVal : 0;
                  return (
                    <div key={`${i}-${j}`} style={{
                      background: `rgba(59, 130, 246, ${0.2 + opacity * 0.8})`,
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: '#fff'
                    }}>
                      {cell}
                    </div>
                  );
                })
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Actual (Rows) vs Predicted (Cols)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}