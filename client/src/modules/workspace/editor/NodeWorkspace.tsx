// client/src/modules/workspace/editor/NodeWorkspace.tsx
import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { MLNodeData } from '../config/nodeCatalog';
import { useWorkflowStore } from '../store/workflowStore';

// Mock data for lineage and previews (Can be wired up in Priority 3)
const mockLineage = [
  { id: '1', title: 'Load CSV', color: '#64B5F6' },
  { id: '2', title: 'Drop Nulls', color: '#FFA931' },
  { id: '3', title: 'Encode Categorical', color: '#B39DDB' },
];

interface NodeWorkspaceProps {
  nodeId: string; // <-- ADDED to identify the node in the store
  nodeData: MLNodeData;
  onClose: () => void;
}

export default function NodeWorkspace({ nodeId, nodeData, onClose }: NodeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'docs'>('params');
  const [rightTab, setRightTab] = useState<'output' | 'comparison' | 'logs'>('output');
  const [bottomTab, setBottomTab] = useState<'code' | 'console' | 'ai'>('code');
  
  // Pull update function from Zustand
  const updateNodeCode = useWorkflowStore((state) => state.updateNodeCode);
  
  // Get existing custom code from nodeData, or generate a placeholder
  const generateInitialCode = () => {
    // 1. If the user has already typed custom code and saved it in the store, load it
    if (nodeData.customCode) return nodeData.customCode;
    
    // 2. Fallback to a clean placeholder
    return `# Auto-generated code for ${nodeData.title}\nimport pandas as pd\n\n# TODO: Implement ${nodeData.title} logic\n`;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      // Save changes instantly back to Zustand store
      updateNodeCode(nodeId, value);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#1e1e1e', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      
      {/* --- HEADER (64px) --- */}
      <header style={{ height: '64px', background: '#111', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${nodeData.categoryColor}22`, border: `1px solid ${nodeData.categoryColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {nodeData.icon || '⚙️'}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{nodeData.title}</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{nodeData.category}</p>
        </div>
        
        <div style={{ marginLeft: '24px', display: 'flex', gap: '16px', color: '#888', fontSize: '13px' }}>
          <span>⏱ 0.12s</span>
          <span>🧠 128MB</span>
          <span>💻 12% CPU</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button style={btnGhost}>Reset</button>
          <button style={btnGhost}>Save</button>
          <button style={btnPrimary}>▶ Run Node</button>
          <button onClick={onClose} style={{ ...btnGhost, borderColor: '#ff5050', color: '#ff5050' }}>✕ Close</button>
        </div>
      </header>

      {/* --- DATA LINEAGE STRIP --- */}
      <div style={{ height: '48px', background: '#181818', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', overflowX: 'auto', flexShrink: 0 }}>
        <span style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', marginRight: '8px' }}>Lineage:</span>
        {mockLineage.map((node, i) => (
          <React.Fragment key={node.id}>
            <div style={{ padding: '6px 12px', background: '#222', borderRadius: '6px', border: `1px solid ${node.color}55`, color: '#fff', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {node.title}
            </div>
            {i < mockLineage.length - 1 && <span style={{ color: '#444' }}>→</span>}
          </React.Fragment>
        ))}
        <span style={{ color: '#444' }}>→</span>
        <div style={{ padding: '6px 12px', background: `${nodeData.categoryColor}22`, borderRadius: '6px', border: `1px solid ${nodeData.categoryColor}`, color: '#fff', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(255,138,0,0.3)' }}>
          ▶ {nodeData.title}
        </div>
      </div>

      {/* --- MAIN 3-COLUMN LAYOUT (Raw Flexbox) --- */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        
        {/* LEFT PANEL: Incoming Dataset (30%) */}
        <div style={{ ...panelStyle, width: '30%', minWidth: '180px' }}>
          <h3 style={panelHeaderStyle}>Incoming Dataset</h3>
          <div style={{ padding: '16px' }}>
            <div style={statGrid}>
              <div style={statCard}><span>Rows</span><strong>10,000</strong></div>
              <div style={statCard}><span>Columns</span><strong>25</strong></div>
              <div style={statCard}><span>Memory</span><strong>1.2MB</strong></div>
              <div style={statCard}><span>Missing</span><strong>0.5%</strong></div>
            </div>
            
            <h4 style={{ marginTop: '24px', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Preview (First 5 Rows)</h4>
            <div style={{ marginTop: '8px', background: '#0d0d0d', borderRadius: '8px', border: '1px solid #222', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#161616' }}>
                    <th style={thStyle}>age</th>
                    <th style={thStyle}>income</th>
                    <th style={thStyle}>city</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={tdStyle}>34</td><td style={tdStyle}>50000</td><td style={tdStyle}>NY</td></tr>
                  <tr><td style={tdStyle}>45</td><td style={tdStyle}>82000</td><td style={tdStyle}>LA</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={resizeHandleStyle} />

        {/* CENTER PANEL: Configuration (40%) */}
        <div style={{ ...panelStyle, width: '40%', minWidth: '180px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
            <button style={activeTab === 'params' ? tabActive : tabIdle} onClick={() => setActiveTab('params')}>Parameters</button>
            <button style={activeTab === 'docs' ? tabActive : tabIdle} onClick={() => setActiveTab('docs')}>Documentation</button>
          </div>
          
          <div style={{ padding: '24px', overflowY: 'auto', height: 'calc(100% - 41px)' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={paramLabel}>Strategy</label>
              <select style={paramInput}><option>Drop All Nulls</option><option>Drop if All Nulls</option></select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={paramLabel}>Axis</label>
              <select style={paramInput}><option>Rows (0)</option><option>Columns (1)</option></select>
            </div>
            
            <div style={{ marginTop: '32px', padding: '16px', background: '#0d0d0d', borderRadius: '8px', border: '1px solid #222' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Execution Info</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa' }}>
                <span>Modifies Dataset?</span> <span style={{ color: '#00b884' }}>Yes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa', marginTop: '8px' }}>
                <span>Requires Previous Node?</span> <span style={{ color: '#00b884' }}>Yes</span>
              </div>
            </div>
          </div>
        </div>

        <div style={resizeHandleStyle} />

        {/* RIGHT PANEL: Output & Comparison (30%) */}
        <div style={{ ...panelStyle, width: '30%', minWidth: '180px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #222' }}>
            <button style={rightTab === 'output' ? tabActive : tabIdle} onClick={() => setRightTab('output')}>Output</button>
            <button style={rightTab === 'comparison' ? tabActive : tabIdle} onClick={() => setRightTab('comparison')}>Comparison</button>
            <button style={rightTab === 'logs' ? tabActive : tabIdle} onClick={() => setRightTab('logs')}>Logs</button>
          </div>

          <div style={{ padding: '16px', height: 'calc(100% - 41px)', overflowY: 'auto' }}>
            {rightTab === 'output' && (
              <div style={{ background: '#0d0d0d', borderRadius: '8px', border: '1px solid #222', padding: '12px' }}>
                <span style={{ color: '#00b884', fontSize: '12px' }}>✓ Execution Successful</span>
                <div style={{ marginTop: '8px', color: '#aaa', fontSize: '13px' }}>
                  Output DataFrame: 9,950 rows × 25 columns
                </div>
              </div>
            )}
            {rightTab === 'comparison' && (
              <div style={{ display: 'flex', gap: '8px', height: '100%' }}>
                <div style={{ flex: 1, background: '#0d0d0d', borderRadius: '8px', border: '1px solid #333', padding: '8px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>BEFORE</span>
                  <div style={{ marginTop: '8px', height: '4px', background: '#ff5050', borderRadius: '2px', width: '80%' }}></div>
                  <div style={{ fontSize: '11px', color: '#ff5050', marginTop: '4px' }}>50 rows removed</div>
                </div>
                <div style={{ flex: 1, background: '#0d0d0d', borderRadius: '8px', border: '1px solid #333', padding: '8px' }}>
                  <span style={{ color: '#666', fontSize: '11px' }}>AFTER</span>
                  <div style={{ marginTop: '8px', height: '4px', background: '#00b884', borderRadius: '2px', width: '75%' }}></div>
                  <div style={{ fontSize: '11px', color: '#00b884', marginTop: '4px' }}>Clean & ready</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- BOTTOM DOCK: MONACO IDE --- */}
      <div style={{ height: '300px', borderTop: '1px solid #333', background: '#0d0d0d', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ height: '36px', background: '#111', display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid #222' }}>
          <button style={bottomTab === 'code' ? tabActive : tabIdle} onClick={() => setBottomTab('code')}>Python Code</button>
          <button style={bottomTab === 'console' ? tabActive : tabIdle} onClick={() => setBottomTab('console')}>Console</button>
          <button style={bottomTab === 'ai' ? tabActive : tabIdle} onClick={() => setBottomTab('ai')}>AI Explanation</button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button style={{ ...btnGhost, padding: '4px 8px', fontSize: '11px' }}>Format</button>
            <button style={{ ...btnPrimary, padding: '4px 12px', fontSize: '11px' }}>▶ Run Code</button>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          {bottomTab === 'code' && (
            <Editor 
              height="100%" 
              defaultLanguage="python" 
              theme="vs-dark" 
              value={generateInitialCode()} // <-- READS from store/generator
              onChange={handleEditorChange} // <-- WRITES back to store on keystroke
              options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on' }}
            />
          )}
          {bottomTab === 'console' && (
            <div style={{ padding: '16px', color: '#aaa', fontFamily: 'monospace' }}>
              <span style={{ color: '#00b884' }}>[Execution Completed in 0.12s]</span><br/>
              Rows dropped: 50<br/>
              Final shape: (9950, 25)
            </div>
          )}
          {bottomTab === 'ai' && (
            <div style={{ padding: '16px', color: '#888' }}>
              AI Explanation will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Inline Style Constants ---
const btnPrimary: React.CSSProperties = { background: '#ff8c1a', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
const btnGhost: React.CSSProperties = { background: '#161616', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };
const panelStyle: React.CSSProperties = { background: '#181818', overflow: 'hidden' };
const panelHeaderStyle: React.CSSProperties = { margin: 0, padding: '16px', borderBottom: '1px solid #222', color: '#fff', fontSize: '14px' };
const resizeHandleStyle: React.CSSProperties = { width: '4px', background: '#222', cursor: 'col-resize', transition: 'background 0.2s' };
const tabActive: React.CSSProperties = { background: 'none', border: 'none', color: '#fff', padding: '12px 16px', cursor: 'pointer', borderBottom: '2px solid #ff8c1a' };
const tabIdle: React.CSSProperties = { background: 'none', border: 'none', color: '#666', padding: '12px 16px', cursor: 'pointer', borderBottom: '2px solid transparent' };
const paramLabel: React.CSSProperties = { display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' };
const paramInput: React.CSSProperties = { width: '100%', background: '#0d0d0d', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' };
const statGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' };
const statCard: React.CSSProperties = { background: '#0d0d0d', padding: '8px', borderRadius: '6px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '4px' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px', borderBottom: '1px solid #222', color: '#888', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '8px', borderBottom: '1px solid #1a1a1a', color: '#ddd' };