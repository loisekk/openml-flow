// client/src/modules/workspace/panels/BottomPanel.tsx
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useCodeGenerator } from '../hooks/useCodeGenerator';
import { useWorkflowStore } from '../store/workflowStore';
import { PanelBottomClose, RotateCcw, Download, Package } from 'lucide-react';

interface BottomPanelProps {
  onCollapse: () => void;
}

export default function BottomPanel({ onCollapse }: BottomPanelProps) {
  const [bottomTab, setBottomTab] = useState('code');
  const generatedCode = useCodeGenerator();
  const editorRef = useRef<any>(null);

  const { executionLogs, isExecuting, customWorkflowCode, setCustomWorkflowCode } = useWorkflowStore();
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Artifacts state
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(false);

  const fetchArtifacts = async () => {
    setArtifactsLoading(true);
    try {
      const res = await fetch('/api/outputs');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setArtifacts(data);
      }
    } catch { /* silent — non-critical */ }
    setArtifactsLoading(false);
  };

  // Fetch on mount
  useEffect(() => { fetchArtifacts(); }, []);

  // Re-fetch when execution completes (isExecuting true → false)
  const prevExecuting = useRef(false);
  useEffect(() => {
    if (prevExecuting.current && !isExecuting) {
      fetchArtifacts(); // Execution just finished — check for new artifacts
    }
    prevExecuting.current = isExecuting;
  }, [isExecuting]);

  const [editorCode, setEditorCode] = useState(customWorkflowCode || generatedCode);

  useEffect(() => {
    if (!customWorkflowCode) setEditorCode(generatedCode);
  }, [generatedCode, customWorkflowCode]);

  useEffect(() => {
    if (consoleEndRef.current) consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [executionLogs]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('mlpipe-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background': '#0B1018',
        'editor.lineHighlightBackground': '#151C2D',
        'editorCursor.foreground': '#FF7A00',
        'editorLineNumber.foreground': '#5D6675',
        'editor.selectionBackground': '#8B5CF640'
      },
    });
    monaco.editor.setTheme('mlpipe-dark');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorCode(value);
      setCustomWorkflowCode(value);
    }
  };

  const handleResetCode = () => {
    setCustomWorkflowCode(null);
    setEditorCode(generatedCode);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pkl')) return '📦';
    if (name.endsWith('.py')) return '📄';
    if (name.endsWith('.png')) return '📊';
    if (name.endsWith('.csv')) return '📋';
    return '📎';
  };

  const getFileLabel = (name: string) => {
    if (name.endsWith('.pkl')) return 'Trained Model';
    if (name.endsWith('.py')) return 'FastAPI Service';
    if (name.endsWith('.png')) return 'Chart';
    if (name.endsWith('.csv')) return 'Exported Data';
    return 'File';
  };

  return (
    <div className="uw-bottom-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--border)' }}>
      <div className="uw-bottom-tabs" style={{ flexShrink: 0 }}>
        <div className={`uw-bottom-tab ${bottomTab === 'code' ? 'active' : ''}`} onClick={() => setBottomTab('code')}>Code</div>
        <div className={`uw-bottom-tab ${bottomTab === 'console' ? 'active' : ''}`} onClick={() => setBottomTab('console')}>
          Console {isExecuting && <span style={{ marginLeft: '4px', width: '8px', height: '8px', background: 'var(--accent-orange)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>}
        </div>
        <div className={`uw-bottom-tab ${bottomTab === 'artifacts' ? 'active' : ''}`} onClick={() => { setBottomTab('artifacts'); fetchArtifacts(); }}>
          Artifacts {artifacts.length > 0 && <span style={{ marginLeft: '4px', background: 'var(--accent-green)', color: '#050B18', borderRadius: '8px', fontSize: '10px', padding: '1px 6px', fontWeight: 700 }}>{artifacts.length}</span>}
        </div>
        <div className={`uw-bottom-tab ${bottomTab === 'variables' ? 'active' : ''}`} onClick={() => setBottomTab('variables')}>Variables</div>
        <div className={`uw-bottom-tab ${bottomTab === 'perf' ? 'active' : ''}`} onClick={() => setBottomTab('perf')}>Performance</div>

        {bottomTab === 'code' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '10px' }}>
            {customWorkflowCode && (
              <span style={{ fontSize: '11px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ● Custom Code
                <button onClick={handleResetCode} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', fontSize: '11px' }}>
                  <RotateCcw size={12} /> Reset to Graph
                </button>
              </span>
            )}
          </div>
        )}

        <button onClick={onCollapse} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 10px' }} title="Collapse panel (⌘J)">
          <PanelBottomClose size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {bottomTab === 'code' && (
          <Editor
            height="100%"
            defaultLanguage="python"
            value={editorCode}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              readOnly: false
            }}
          />
        )}

        {bottomTab === 'console' && (
          <div style={{ padding: '16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px', height: '100%', overflowY: 'auto', background: '#0B1018' }}>
            {executionLogs.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>[INFO] Awaiting execution...</span> : executionLogs.map((log, idx) => {
              let color = 'var(--text-primary)';
              if (log.includes('[ERROR]') || log.includes('[STDERR]')) color = 'var(--accent-red)';
              else if (log.includes('[INFO]')) color = 'var(--text-muted)';
              else if (log.includes('[SUCCESS]')) color = 'var(--accent-green)';
              else if (log.includes('[VALIDATION]')) color = 'var(--accent-orange)';
              else if (log.includes('📦')) color = 'var(--accent-cyan)';
              return <div key={idx} style={{ color, marginBottom: '4px', whiteSpace: 'pre-wrap' }}>{log}</div>;
            })}
            <div ref={consoleEndRef} />
          </div>
        )}

        {/* ARTIFACTS TAB — download your model, code, and charts */}
        {bottomTab === 'artifacts' && (
          <div style={{ padding: '16px', overflowY: 'auto', background: '#0B1018', height: '100%' }}>
            {artifactsLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading artifacts...</div>
            ) : artifacts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                No artifacts yet.<br />
                Add <strong>Save Pipeline</strong> or <strong>Generate FastAPI</strong> nodes to collect your model and code.<br />
                <span style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '8px', display: 'inline-block' }}>
                  Files are saved to <code style={{ background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: '4px' }}>uploads/artifacts/</code> on your machine
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {artifacts.map((file) => (
                  <div key={file.name} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'var(--color-surface-2)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '12px 14px',
                  }}>
                    <span style={{ fontSize: '24px' }}>{getFileIcon(file.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {getFileLabel(file.name)} · {file.size}{file.modified ? ` · ${file.modified}` : ''}
                      </div>
                    </div>
                    <a
                      href={`/api/outputs/${file.name}`}
                      download
                      style={{
                        background: 'var(--accent-orange)', color: '#050B18', border: 'none',
                        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                      }}
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                ))}
                <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  💡 Files persist in <code style={{ background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: '3px' }}>uploads/artifacts/</code> — they survive container updates and restarts.
                </div>
              </div>
            )}
          </div>
        )}

        {bottomTab === 'variables' && (
          <div style={{ padding: '16px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {['df', 'X', 'y', 'X_train', 'X_test', 'y_train', 'y_test', 'model'].map((v) => (
              <div key={v} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)' }}>{v}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Type: DataFrame</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shape: (0, 0)</div>
              </div>
            ))}
          </div>
        )}

        {bottomTab === 'perf' && (
          <div style={{
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            height: '100%',
            overflowY: 'auto',
            background: '#07101F'
          }}>
            {[
              { label: 'CPU', value: '32%', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
              { label: 'RAM', value: '2.1 GB', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.1)' },
              { label: 'GPU', value: '18%', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)' },
              { label: 'Disk I/O', value: '45 MB/s', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)' },
              { label: 'Network', value: '12 Mbps', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' }
            ].map((metric) => (
              <div key={metric.label} style={{
                background: metric.bg,
                border: `1px solid ${metric.color}30`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{metric.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: metric.color }}>{metric.value}</div>
                <div style={{ height: '24px', marginTop: '8px', background: `${metric.color}15`, borderRadius: '4px' }}></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}