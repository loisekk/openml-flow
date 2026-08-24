// client/src/modules/workspace/panels/NodeStudio.tsx
import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { X, Play, RotateCcw, Sparkles, Send, Upload, Package, CheckCircle, BarChart3 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import { buildNodeCode } from '../utils/codeGeneratorUtils';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { useExecutionEngine } from '../hooks/useExecutionEngine';
import ChartsPanel from '../canvas/components/charts/ChartsPanel';
import ErrorBoundary from '../components/ErrorBoundary';

const LOADER_NODES = ['Load CSV', 'Load JSON', 'Load Excel'];

export default function NodeStudio({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  // STABLE SELECTORS — never put `?? []` or `.map()` INSIDE a Zustand selector:
  // a fresh array each call crashes React's snapshot cache (the black screen bug).
  // Fallbacks happen OUTSIDE the selector, in component scope.
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeCode = useWorkflowStore((s) => s.updateNodeCode);
  const updateNodeParameters = useWorkflowStore((s) => s.updateNodeParameters);
  const nodeCharts = useWorkflowStore((s) => s.nodeCharts?.[nodeId]);
  const charts = nodeCharts ?? [];

  const node = nodes.find(n => n.id === nodeId);
  const { executeNode } = useExecutionEngine();

  const [activeTab, setActiveTab] = useState<'params' | 'code' | 'charts' | 'env' | 'ai'>('params');
  const [editorCode, setEditorCode] = useState('');
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [loadingEnv, setLoadingEnv] = useState(true);

  const { messages, sendMessage, isThinking } = useAiAssistant();
  const [aiInput, setAiInput] = useState('');

  // Code tab shows ONLY this node's section (not the whole chain script).
  // Empty customCode → live template. Editing stores it as this node's custom code.
  useEffect(() => {
    if (node) {
      setEditorCode(node.data.customCode?.trim() ? node.data.customCode : buildNodeCode(node));
    }
  }, [node]);

  // Auto-switch to Charts ONLY when a NEW/UPDATED chart arrives during this session.
  // First render (opening a node that already has charts) does NOT switch tabs.
  const latestChartAt = charts.length > 0 ? Math.max(...charts.map(c => c.createdAt)) : 0;
  const prevLatestChartAt = useRef<number | null>(null);
  useEffect(() => {
    if (prevLatestChartAt.current === null) {
      prevLatestChartAt.current = latestChartAt; // skip first render
      return;
    }
    if (latestChartAt > prevLatestChartAt.current) setActiveTab('charts');
    prevLatestChartAt.current = latestChartAt;
  }, [latestChartAt]);

  useEffect(() => {
    if (activeTab === 'env') {
      fetchPackages();
    }
  }, [activeTab]);

  const fetchPackages = async () => {
    setLoadingEnv(true);
    try {
      const res = await fetch('/api/environment/packages');
      const data = await res.json();
      if (data.packages) {
        setInstalledPackages(data.packages.map((p: any) => p.name.toLowerCase()));
      }
    } catch (err) {
      console.error('Failed to fetch packages', err);
    } finally {
      setLoadingEnv(false);
    }
  };

  if (!node) return null;

  const isModified = !!(node.data.customCode && node.data.customCode.trim().length > 0);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorCode(value);
      updateNodeCode(node.id, value);
    }
  };

  // Reset = CLEAR the custom override; the live template takes over again.
  const handleResetCode = () => {
    updateNodeCode(node.id, '');
    setEditorCode(buildNodeCode(node));
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiInput.trim()) {
      sendMessage(aiInput);
      setAiInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/dataset/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.path) {
        updateNodeParameters(node.id, 'filePath', data.path);
        useWorkflowStore.getState().associateDataset(data.filename);
      }
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monaco.editor.defineTheme('mlpipe-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: { 
        'editor.background': '#050B18', 'editor.lineHighlightBackground': '#151C2D', 
        'editorCursor.foreground': '#FF7A00', 'editorLineNumber.foreground': '#5D6675', 
        'editor.selectionBackground': '#8B5CF640' 
      },
    });
    monaco.editor.setTheme('mlpipe-dark');
  };

  const acceptType = node.data.title === 'Load CSV' ? '.csv' : node.data.title === 'Load JSON' ? '.json' : '.xlsx,.xls';

  return (
    <div style={{
      position: 'absolute', top: '8%', left: '15%', right: '15%', bottom: '8%',
      background: '#0A1426', border: '1px solid #18253A', borderRadius: '12px',
      zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #18253A', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, background: '#07101F' }}>
        <span style={{ fontSize: '24px', color: node.data.color }}>{node.data.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#F4F7FB' }}>{node.data.title}</div>
          <div style={{ fontSize: '11px', color: '#65758C' }}>{node.data.category} • Node Studio</div>
        </div>
        <button onClick={() => executeNode(node.id)} style={{ background: node.data.status === 'running' ? '#FF8A00' : '#22C55E', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <Play size={14} /> {node.data.status === 'running' ? 'Running...' : 'Run Node'}
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#65758C', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', padding: '0 20px', borderBottom: '1px solid #18253A', flexShrink: 0, background: '#07101F' }}>
        <div style={tabStyle(activeTab === 'params')} onClick={() => setActiveTab('params')}>Parameters</div>
        <div style={tabStyle(activeTab === 'code')} onClick={() => setActiveTab('code')}>Code {isModified && <span style={{ color: '#8B5CF6', marginLeft: '4px', fontSize: '10px' }}>● Modified</span>}</div>
        <div style={tabStyle(activeTab === 'charts')} onClick={() => setActiveTab('charts')}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <BarChart3 size={13} /> Charts
            {charts.length > 0 && <span style={{ background: '#06B6D4', color: '#050B18', borderRadius: '8px', fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}>{charts.length}</span>}
          </span>
        </div>
        <div style={tabStyle(activeTab === 'env')} onClick={() => setActiveTab('env')}>Environment</div>
        <div style={tabStyle(activeTab === 'ai')} onClick={() => setActiveTab('ai')}>AI Assistant</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'params' && (
          <div style={{ padding: '24px', overflowY: 'auto', background: '#0A1426' }}>
            {LOADER_NODES.includes(node.data.title) && (
              <div style={{ marginBottom: '24px', padding: '16px', background: '#050B18', border: '1px solid #18253A', borderRadius: '8px' }}>
                <label style={{ fontSize: '12px', color: '#9AA9BF', display: 'block', marginBottom: '12px', fontWeight: 600 }}>UPLOAD LOCAL DATASET</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ background: '#0E1A2E', border: '1px solid #33496A', color: '#F4F7FB', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={14} /> Choose File
                    <input type="file" accept={acceptType} onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '12px', color: '#65758C' }}>
                    {(() => {
                      const filePath = node.data.parameters.find((p: any) => p.name === 'filePath')?.default;
                      if (filePath && !['data.csv', 'data.json', 'data.xlsx'].includes(filePath)) {
                        const fileName = String(filePath).split(/[\\/]/).pop() ?? String(filePath);
                        return `Selected: ${fileName}`;
                      }
                      return 'No file selected';
                    })()}
                  </span>
                </div>
              </div>
            )}

            {node.data.parameters.map((param: any) => (
              <div key={param.name} style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: '#9AA9BF', display: 'block', marginBottom: '6px', fontWeight: 500 }}>{param.label}</label>
                {param.type === 'select' ? (
                  <select
                    value={String(param.default ?? '')}
                    onChange={(e) => updateNodeParameters(node.id, param.name, e.target.value)}
                    style={{ width: '100%', background: '#050B18', border: '1px solid #18253A', color: '#F4F7FB', padding: '10px 12px', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
                  >
                    {(param.options ?? []).map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={param.default ?? ''}
                    onChange={(e) => updateNodeParameters(node.id, param.name, e.target.value)}
                    style={{ width: '100%', background: '#050B18', border: '1px solid #18253A', color: '#F4F7FB', padding: '10px 12px', borderRadius: '6px', outline: 'none', fontSize: '14px' }}
                  />
                )}
              </div>
            ))}

            <div style={{ marginTop: '24px', padding: '16px', background: '#050B18', borderRadius: '8px', border: '1px solid #18253A' }}>
              <div style={{ fontSize: '12px', color: '#65758C', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>Data Flow Context</div>
              <div style={{ fontSize: '13px', color: '#9AA9BF', lineHeight: 1.6 }}>
                <strong style={{ color: '#F4F7FB' }}>Input:</strong> {node.data.inputs.join(', ') || 'None'} <br/>
                <strong style={{ color: '#F4F7FB' }}>Output:</strong> {node.data.outputs.join(', ') || 'None'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050B18' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #18253A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', background: '#07101F' }}>
              <span style={{ fontSize: '11px', color: '#65758C' }}>This node's code — edits override the template. Clear all text to revert.</span>
              <button onClick={handleResetCode} style={ghostBtnStyle}><RotateCcw size={14} /> Reset Code</button>
            </div>
            <Editor height="100%" defaultLanguage="python" value={editorCode} onChange={handleEditorChange} onMount={handleEditorDidMount} options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true }} />
          </div>
        )}

        {activeTab === 'charts' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#0A1426' }}>
            <ErrorBoundary label="Charts">
              <ChartsPanel nodeId={nodeId} />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === 'env' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#0A1426' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Package size={24} color="#8B5CF6" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: '#F4F7FB' }}>Node Dependencies</div>
                <div style={{ fontSize: '11px', color: '#65758C' }}>Packages required to run this node</div>
              </div>
            </div>

            {loadingEnv ? (
              <div style={{ color: '#65758C' }}>Checking installed packages...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {node.data.dependencies && node.data.dependencies.length > 0 ? (
                  node.data.dependencies.map((dep: string) => {
                    const isInstalled = installedPackages.includes(dep.toLowerCase().replace('_', '-'));
                    return (
                      <div key={dep} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#050B18', border: '1px solid #18253A', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#F4F7FB' }}>{dep}</div>
                          <div style={{ fontSize: '11px', color: '#65758C' }}>{isInstalled ? 'Installed' : 'Not Installed'}</div>
                        </div>
                        {isInstalled ? (
                          <div style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={16} /> Ready
                          </div>
                        ) : (
                          <a href="/settings" style={{ background: '#FF7A00', color: '#000', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>
                            Install
                          </a>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#65758C' }}>No external dependencies required for this node.</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0A1426' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {messages.length === 0 ? (
                <div style={{ color: '#65758C', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Sparkles size={20} color="#8B5CF6" /> <span style={{ color: '#F4F7FB', fontWeight: 600 }}>AI Assistant for {node.data.title}</span>
                  </div>
                  <button onClick={() => sendMessage(`Explain the ${node.data.title} node`)} style={quickActionBtn}>Explain this node</button>
                  <button onClick={() => sendMessage(`Optimize parameters for ${node.data.title}`)} style={quickActionBtn}>Optimize parameters</button>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ background: msg.role === 'user' ? '#8B5CF6' : '#0E1A2E', color: msg.role === 'user' ? 'white' : '#F4F7FB', padding: '12px 16px', borderRadius: '8px', maxWidth: '85%', fontSize: '14px', border: msg.role === 'assistant' ? '1px solid #18253A' : 'none' }}>{msg.content}</div>
                  </div>
                ))
              )}
              {isThinking && <div style={{ color: '#65758C', fontSize: '12px', marginTop: '8px' }}>Thinking...</div>}
            </div>
            <form onSubmit={handleAiSubmit} style={{ padding: '16px 24px', borderTop: '1px solid #18253A', display: 'flex', gap: '8px', background: '#07101F' }}>
              <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder={`Ask about ${node.data.title}...`} style={{ flex: 1, background: '#050B18', border: '1px solid #18253A', color: '#F4F7FB', padding: '12px 16px', borderRadius: '6px', outline: 'none', fontSize: '14px' }} />
              <button type="submit" style={{ background: '#8B5CF6', color: 'white', border: 'none', padding: '0 20px', borderRadius: '6px', cursor: 'pointer' }}><Send size={16} /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '16px 0', fontSize: '14px', cursor: 'pointer', color: active ? '#F4F7FB' : '#65758C', borderBottom: active ? '2px solid #FF7A00' : '2px solid transparent', marginBottom: '-1px', fontWeight: 500
});

const ghostBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #18253A', color: '#9AA9BF', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
};

const quickActionBtn: React.CSSProperties = {
  display: 'block', textAlign: 'left', background: '#0E1A2E', border: '1px solid #18253A', color: '#F4F7FB', padding: '12px 16px', borderRadius: '6px', cursor: 'pointer', marginBottom: '10px', fontSize: '13px', width: '100%'
};