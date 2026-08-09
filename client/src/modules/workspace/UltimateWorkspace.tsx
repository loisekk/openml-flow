import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkspaceCanvas from './canvas/WorkspaceCanvas';
import InspectorPanel from './panels/InspectorPanel';
import BottomPanel from './panels/BottomPanel'; 
import EvaluationsPanel from './panels/EvaluationsPanel';
import AIAssistantDrawer from './panels/AIAssistantDrawer';
import NodeStudio from './panels/NodeStudio';
import { useWorkflowStore } from './store/workflowStore';
import { useExecutionEngine } from './hooks/useExecutionEngine';
import { useAutoSave } from './hooks/useAutoSave';
import { useValidationEngine } from './hooks/useValidationEngine';
import { nodeCategories, nodeRegistry } from './config/nodeRegistry';
import { Sparkles, PanelBottomClose, PanelRightClose, PanelRightOpen, PanelBottomOpen } from 'lucide-react';
import './UltimateWorkspace.css';

const UltimateWorkspace = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { 
    activeTab, setTab, addNode, undo, redo, past, future, setSelectedNodeId, nodes,
    bottomPanelHeight, bottomPanelCollapsed, toggleBottomPanel,
    inspectorWidth, inspectorCollapsed, toggleInspector,
    aiAssistantOpen, toggleAIAssistant,
    setBottomPanelHeight, setInspectorWidth, setAIAssistantWidth, aiAssistantWidth,
    activeNodeStudioId, setActiveNodeStudio,
    workflowName, setWorkflowName 
  } = useWorkflowStore();
  
  const { executeWorkflow, isExecuting } = useExecutionEngine();
  const [nodeSearchQuery, setNodeSearchQuery] = useState('');
  const saveStatus = useAutoSave(id || 'new');
  const { issues, healthScore } = useValidationEngine();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Data Loading']);
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const activeIssues = issues.filter(i => i.severity !== 'success');
  const errorCount = activeIssues.filter(i => i.severity === 'error').length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggleBottomPanel();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        toggleInspector();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'j') {
        e.preventDefault();
        toggleAIAssistant();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, toggleBottomPanel, toggleInspector, toggleAIAssistant]);

  const handleAddNode = (type: string) => {
    const nodeDef = nodeRegistry[type];
    if (!nodeDef) return;
    addNode({ ...nodeDef, status: 'idle' }, { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 });
  };

  const startVResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = bottomPanelHeight;
    const onMove = (moveEvent: MouseEvent) => {
      const dy = startY - moveEvent.clientY;
      setBottomPanelHeight(startH + dy);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startHResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = inspectorWidth;
    const onMove = (moveEvent: MouseEvent) => {
      const dx = startX - moveEvent.clientX;
      setInspectorWidth(startW + dx);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startAIResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = aiAssistantWidth;
    const onMove = (moveEvent: MouseEvent) => {
      const dx = startX - moveEvent.clientX;
      setAIAssistantWidth(startW + dx);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const cycleBottomPanelHeight = () => {
    const heights = [160, 280, 450];
    const currentIdx = heights.findIndex(h => Math.abs(h - bottomPanelHeight) < 50);
    const nextIdx = (currentIdx + 1) % heights.length;
    setBottomPanelHeight(heights[nextIdx >= 0 ? nextIdx : 1]);
  };

  return (
    <div className="uw-root" style={{ overflow: 'hidden' }}>
      {/* 1. GLOBAL HEADER */}
      <header className="uw-global-header">
        <div className="uw-logo">
          <span style={{ color: 'var(--accent-orange)' }}>◈</span> open-mlpipe
          <span className="uw-badge">LOCAL RUNTIME</span>
        </div>
        <div className="uw-nav-links">
          <span className="uw-nav-link active">Studio</span>
          <span className="uw-nav-link">Models</span>
          {/* WIRED UP NAVIGATION */}
          <span className="uw-nav-link" onClick={() => navigate('/datasets')}>Datasets</span>
          <span className="uw-nav-link">Experiments</span>
          <span className="uw-nav-link">Deployments</span>
        </div>
        <div className="uw-header-right">
          <span>🔍 Search</span><span>🔔</span>
          {/* WIRED UP SETTINGS */}
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')}>⚙️</span>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)' }}></div>
        </div>
      </header>

      {/* 2. WORKFLOW HEADER */}
      <header className="uw-workflow-header">
        <div className="uw-breadcrumb">
          <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>←</span>
          <span style={{ color: 'var(--text-muted)' }}>Personal</span>
          <span style={{ color: 'var(--border)' }}>/</span>
          
          {/* EDITABLE WORKFLOW NAME INPUT */}
          <input 
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: '1px solid transparent', 
              color: 'var(--text-primary)', 
              fontWeight: 500, 
              fontSize: '14px',
              padding: '4px 8px',
              borderRadius: '4px',
              outline: 'none',
              width: '200px'
            }}
            onFocus={(e) => e.currentTarget.style.border = '1px solid var(--border)'}
            onBlur={(e) => e.currentTarget.style.border = '1px solid transparent'}
          />
          
          <span style={{ marginLeft: '12px', fontSize: '12px', color: saveStatus === 'Saving...' ? 'var(--accent-orange)' : 'var(--accent-green)' }}>● {saveStatus}</span>
        </div>
        
        <div className="uw-floating-nav">
          <div className={`uw-nav-tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setTab('editor')}>Editor</div>
          <div className={`uw-nav-tab ${activeTab === 'executions' ? 'active' : ''}`} onClick={() => setTab('executions')}>Executions</div>
          <div className={`uw-nav-tab ${activeTab === 'evaluations' ? 'active' : ''}`} onClick={() => setTab('evaluations')}>AI Evaluations</div>
        </div>

        <div className="uw-wf-actions">
          <button onClick={undo} disabled={past.length === 0} style={ghostBtnStyle(past.length === 0)}>↩ Undo</button>
          <button onClick={redo} disabled={future.length === 0} style={ghostBtnStyle(future.length === 0)}>↪ Redo</button>
          <button className="uw-btn-primary" onClick={executeWorkflow} disabled={isExecuting} style={{ opacity: isExecuting ? 0.7 : 1 }}>
            {isExecuting ? '⏳ Executing...' : 'Execute Workflow ▶'}
          </button>
        </div>
      </header>

      {/* 3. MAIN FLEX LAYOUT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
        
        {/* TOP AREA: Left Sidebar + Canvas + Inspector */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT: NODE LIBRARY */}
          <aside className="uw-left-panel" style={{ width: 240 }}>
            <div className="uw-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Node Library
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>⚙️</button>
            </div>
            <input 
              ref={searchInputRef}
              value={nodeSearchQuery}
              onChange={(e) => setNodeSearchQuery(e.target.value)}
              className="uw-search" 
              placeholder="Search nodes... (⌘K)" 
            />
            
            <div className="uw-node-list">
              {nodeSearchQuery ? (
                <div style={{ padding: '4px' }}>
                  {Object.entries(nodeRegistry)
                    .filter(([key, nodeDef]) => 
                      nodeDef.title.toLowerCase().includes(nodeSearchQuery.toLowerCase()) ||
                      nodeDef.category.toLowerCase().includes(nodeSearchQuery.toLowerCase())
                    )
                    .map(([key, nodeDef]) => (
                      <div key={key} className="uw-node-item" onClick={() => handleAddNode(key)}>
                        <span style={{ width: '20px', textAlign: 'center', color: nodeDef.color }}>{nodeDef.icon}</span>
                        <div>
                          {nodeDef.title}
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{nodeDef.category}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                Object.entries(nodeCategories).map(([category, nodeList]) => {
                  const isExpanded = expandedCategories.includes(category);
                  return (
                    <div key={category} style={{ marginBottom: '4px' }}>
                      <div 
                        onClick={() => toggleCategory(category)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                          cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                          color: isExpanded ? 'var(--text-primary)' : 'var(--text-muted)', letterSpacing: '0.05em',
                          borderRadius: '4px', transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ width: '8px', textAlign: 'center' }}>{isExpanded ? '▾' : '▸'}</span>
                        {category}
                      </div>
                      
                      {isExpanded && (
                        <div style={{ padding: '0 4px' }}>
                          {nodeList.map((nodeDef) => {
                            const type = Object.keys(nodeRegistry).find((k) => nodeRegistry[k] === nodeDef) || '';
                            return (
                              <div key={nodeDef.title} className="uw-node-item" onClick={() => handleAddNode(type)}>
                                <span style={{ width: '20px', textAlign: 'center', color: nodeDef.color }}>{nodeDef.icon}</span>
                                {nodeDef.title}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <main className="uw-center">
            {activeTab === 'evaluations' ? (
              <EvaluationsPanel />
            ) : (
              <>
                <div className="uw-top-cards">
                  <div className="uw-card" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowDiagnostics(!showDiagnostics)}>
                    <div className="uw-card-title">PIPELINE HEALTH</div>
                    <div className="uw-card-value" style={{ color: errorCount > 0 ? 'var(--accent-red)' : activeIssues.length > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                      {healthScore}% Ready
                    </div>
                  </div>
                  <div className="uw-card"><div className="uw-card-title">RESOURCE MONITOR</div><div style={{ fontSize: '12px' }}>CPU: 12% | RAM: 1.4GB</div></div>
                </div>

                <div className="uw-canvas-wrapper">
                  <WorkspaceCanvas />
                  
                  {nodes.length === 0 && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <h2>Build Your ML Pipeline</h2>
                      <p>Drag nodes from the left panel to get started.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* INSPECTOR */}
          {!inspectorCollapsed ? (
            <>
              <div style={{ width: 4, cursor: 'col-resize', background: 'transparent', flexShrink: 0 }} onMouseDown={startHResize} title="Drag to resize" />
              <div style={{ width: inspectorWidth, flexShrink: 0 }}>
                <InspectorPanel />
              </div>
            </>
          ) : (
            <button onClick={toggleInspector} style={reopenBtnStyle} title="Open Inspector (⌘⇧I)">
              <PanelRightOpen size={16} />
            </button>
          )}
        </div>

        {/* BOTTOM DOCK */}
        {!bottomPanelCollapsed ? (
          <>
            <div style={{ height: 4, cursor: 'row-resize', background: 'transparent', flexShrink: 0 }} onMouseDown={startVResize} onDoubleClick={cycleBottomPanelHeight} title="Drag to resize / Double-click to cycle" />
            <div style={{ height: bottomPanelHeight, flexShrink: 0, overflow: 'hidden' }}>
              <BottomPanel onCollapse={toggleBottomPanel} />
            </div>
          </>
        ) : (
          <div style={{ height: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <button onClick={toggleBottomPanel} style={reopenBtnStyle} title="Open Dev Panel (⌘J)">
              <PanelBottomOpen size={16} /> Open Dev Panel
            </button>
          </div>
        )}
      </div>

      {/* 4. STATUS BAR */}
      <footer className="uw-status-bar">
        <span style={{ color: errorCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{errorCount > 0 ? '✕ Pipeline contains errors' : '● Workflow valid'}</span>
        <span>● {saveStatus}</span>
        <span style={{ marginLeft: 'auto' }}>Python 3.11</span>
        <span>React Flow</span>
        <span style={{ color: 'var(--accent-green)' }}>● Local Runtime Connected</span>
      </footer>

      {/* 5. FLOATING AI BUTTON & DRAWER */}
      {!aiAssistantOpen && (
        <button onClick={toggleAIAssistant} style={floatingAIBtnStyle} title="Open AI Assistant (⌘⇧J)">
          <Sparkles size={20} color="#fff" />
        </button>
      )}
      
      {aiAssistantOpen && (
        <>
          <div style={{ width: 4, cursor: 'col-resize', background: 'transparent', position: 'absolute', right: aiAssistantWidth, top: 120, bottom: 32, zIndex: 1001 }} onMouseDown={startAIResize} />
          <AIAssistantDrawer onClose={toggleAIAssistant} width={aiAssistantWidth} />
        </>
      )}

      {/* 6. NODE STUDIO OVERLAY */}
      {activeNodeStudioId && (
        <NodeStudio nodeId={activeNodeStudioId} onClose={() => setActiveNodeStudio(null)} />
      )}
    </div>
  );
};

const ghostBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'none', border: 'none', color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px', marginRight: '8px'
});

const reopenBtnStyle: React.CSSProperties = {
  background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px'
};

const floatingAIBtnStyle: React.CSSProperties = {
  position: 'absolute', bottom: 48, right: 24, zIndex: 1000, width: 48, height: 48, borderRadius: 14,
  background: 'linear-gradient(135deg, #7C3AED, #A855F7)', border: 'none', cursor: 'pointer',
  boxShadow: '0 0 20px rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'transform 0.15s ease'
};

export default UltimateWorkspace;