// client/src/modules/workspace/panels/InspectorPanel.tsx
import React, { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';

export default function InspectorPanel() {
  const { nodes, selectedNodeId, updateNodeParameters, setSelectedNodeId, executionData } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState<'params' | 'input' | 'code'>('input'); // Default to input to see data

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="uw-right-panel">
        <div className="uw-panel-header">Node Inspector</div>
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Select a node on the canvas to edit its parameters.
        </div>
      </aside>
    );
  }

  const { data } = selectedNode;

  const handleParamChange = (paramName: string, value: any) => {
    updateNodeParameters(selectedNode.id, paramName, value);
  };

  // Render Data Table
  const renderDataPreview = () => {
    if (!executionData) {
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '32px' }}>
          No data loaded. Execute the workflow to see a live data preview.
        </div>
      );
    }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Stats Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span style={statBadge}>Rows: {executionData.shape[0]}</span>
          <span style={statBadge}>Cols: {executionData.shape[1]}</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', borderRadius: '6px', background: '#0B1018' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#151C2D', zIndex: 1 }}>
              <tr>
                {executionData.columns.map((col: string, i: number) => (
                  <th key={i} style={thStyle}>
                    {col}
                    <span style={{ display: 'block', fontSize: '9px', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 400 }}>
                      {executionData.dtypes[i]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {executionData.head.map((row: any[], i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {row.map((cell: any, j: number) => (
                    <td key={j} style={tdStyle}>{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <aside className="uw-right-panel">
      <div className="uw-panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        Node Inspector
        <span style={{ cursor: 'pointer' }} onClick={() => setSelectedNodeId(null)}>✕</span>
      </div>
      
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: data.color }}>{data.icon}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{data.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{data.category}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <div style={tabStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>Data Preview</div>
        <div style={tabStyle(activeTab === 'params')} onClick={() => setActiveTab('params')}>Parameters</div>
        <div style={tabStyle(activeTab === 'code')} onClick={() => setActiveTab('code')}>Code</div>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {activeTab === 'input' && renderDataPreview()}
        
        {activeTab === 'params' && (
          <div>
            {data.parameters.map((param: any) => (
              <div key={param.name} style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  {param.label}
                </label>
                {param.type === 'select' ? (
                  <select value={param.default} onChange={(e) => handleParamChange(param.name, e.target.value)} style={inputStyle}>
                    {param.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : param.type === 'boolean' ? (
                  <input type="checkbox" checked={param.default} onChange={(e) => handleParamChange(param.name, e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                ) : (
                  <input type={param.type === 'number' ? 'number' : 'text'} value={param.default} onChange={(e) => handleParamChange(param.name, param.type === 'number' ? Number(e.target.value) : e.target.value)} style={inputStyle} />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'code' && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {`# Auto-generated code for ${data.title}\nimport pandas as pd\n\n# TODO: Implement logic`}
          </div>
        )}
      </div>
    </aside>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px', borderRadius: '6px', outline: 'none', fontSize: '13px'
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '12px', fontSize: '12px', cursor: 'pointer', 
  borderBottom: active ? '2px solid var(--cyan)' : 'none', 
  color: active ? 'var(--cyan)' : 'var(--text-muted)'
});

const statBadge: React.CSSProperties = {
  background: 'var(--bg-panel)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)'
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 600, borderRight: '1px solid var(--border)', whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px', color: 'var(--text-secondary)', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap'
};