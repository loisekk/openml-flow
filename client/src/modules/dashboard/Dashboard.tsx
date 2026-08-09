import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Workflow, LayoutTemplate, Download, Database, Table2, Brain, Box,
  Rocket, ScrollText, AlertTriangle, KeyRound, Lock, Globe, Settings,
  Search, Bell, Cpu, Plus, Play, Copy, MoreHorizontal, CheckCircle, Clock, XCircle, Activity, FileText, TrendingUp, TrendingDown, ArrowRight
} from 'lucide-react';
import { useDashboardStore } from './useDashboardStore';
import { useWorkflowStore } from '../workspace/store/workflowStore';
import { useAuthStore } from '../auth/authStore';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { workflows, createWorkflow, deleteWorkflow } = useDashboardStore();
  const { setGraph } = useWorkflowStore();
  const { token, logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('workflows');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = () => {
    setGraph([], []);
    const newId = createWorkflow();
    navigate(`/workspace/${newId}`);
  };

  const handleRowClick = async (id: string) => {
    if (id.startsWith('wf-')) {
      setGraph([], []);
      navigate(`/workspace/${id}`);
      return;
    }

    try {
      const res = await fetch(`/api/workflows/load/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.graphData) {
        setGraph(data.graphData.nodes || [], data.graphData.edges || []);
      } else {
        setGraph([], []);
      }
      navigate(`/workspace/${id}`);
    } catch (error) {
      console.error('Failed to load workflow', error);
      setGraph([], []);
      navigate(`/workspace/${id}`);
    }
  };

  const filteredWorkflows = workflows.filter(wf => 
    wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dash-app-shell">
      
      {/* GLOBAL TOP NAV */}
      <header className="dash-global-header">
        <div className="dash-brand">
          <span className="dash-brand-icon">◈</span> open-mlpipe
          <span className="dash-brand-badge">ULTIMATE STUDIO</span>
        </div>
        
        <nav className="dash-top-nav">
          <div className="dash-top-nav-item active">Studio</div>
          <div className="dash-top-nav-item">Models</div>
          <div className="dash-top-nav-item">Datasets</div>
          <div className="dash-top-nav-item">Pipelines</div>
          <div className="dash-top-nav-item">Experiments</div>
          <div className="dash-top-nav-item">Deployments</div>
          <div className="dash-top-nav-item">Marketplace</div>
        </nav>

        <div className="dash-header-right">
          <div className="dash-search-btn">
            <Search size={14} />
            <span>Search...</span>
            <kbd>⌘K</kbd>
          </div>
          <button className="dash-icon-btn"><Bell size={16} /></button>
          <button className="dash-icon-btn" onClick={() => navigate('/settings')}><Settings size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={logout}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-surface-2)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>Y</div>
            <span style={{ fontSize: '12px' }}>yash</span>
          </div>
        </div>
      </header>

      <div className="dash-shell">
        {/* SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-section">Home</div>
          <div className="dash-sidebar-item active"><Home size={16} /> Home</div>
          
          <div className="dash-sidebar-section">Project</div>
          <div className="dash-sidebar-item"><Workflow size={16} /> Workflows</div>
          <div className="dash-sidebar-item"><LayoutTemplate size={16} /> Templates</div>
          <div className="dash-sidebar-item"><Download size={16} /> Imports</div>
          
          <div className="dash-sidebar-section">Data</div>
          <div className="dash-sidebar-item"><Database size={16} /> Datasets</div>
          <div className="dash-sidebar-item"><Table2 size={16} /> Data Tables</div>
          
          <div className="dash-sidebar-section">Models</div>
          <div className="dash-sidebar-item"><Brain size={16} /> Models</div>
          <div className="dash-sidebar-item"><Box size={16} /> Model Registry</div>
          
          <div className="dash-sidebar-section">Observe</div>
          <div className="dash-sidebar-item"><Rocket size={16} /> Executions</div>
          <div className="dash-sidebar-item"><ScrollText size={16} /> Logs</div>
          <div className="dash-sidebar-item"><AlertTriangle size={16} /> Alerts</div>

          <div className="dash-sidebar-section">Settings</div>
          <div className="dash-sidebar-item"><KeyRound size={16} /> Variables</div>
          <div className="dash-sidebar-item" onClick={() => navigate('/settings')}><Lock size={16} /> Credentials</div>
          <div className="dash-sidebar-item"><Globe size={16} /> Environments</div>
          <div className="dash-sidebar-item" onClick={() => navigate('/settings')}><Settings size={16} /> Settings</div>

          <div className="dash-runtime-card">
            <div className="dash-runtime-header">
              <span>Local Runtime</span>
              <span style={{ color: 'var(--success)' }}>● Connected</span>
            </div>
            
            <div className="dash-runtime-metric">
              <div className="dash-runtime-metric-label"><span>CPU</span><span>24%</span></div>
              <div className="dash-runtime-bar"><div className="dash-runtime-bar-fill" style={{ width: '24%', background: 'var(--accent-cyan)' }}></div></div>
            </div>
            
            <div className="dash-runtime-metric">
              <div className="dash-runtime-metric-label"><span>RAM</span><span>2.4 / 16 GB</span></div>
              <div className="dash-runtime-bar"><div className="dash-runtime-bar-fill" style={{ width: '15%', background: 'var(--accent-purple)' }}></div></div>
            </div>
            
            <div className="dash-runtime-metric">
              <div className="dash-runtime-metric-label"><span>GPU</span><span>22%</span></div>
              <div className="dash-runtime-bar"><div className="dash-runtime-bar-fill" style={{ width: '22%', background: 'var(--success)' }}></div></div>
            </div>
            
            <button style={{ marginTop: '12px', width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Cpu size={12} /> Open Monitor
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="dash-main">
          <div className="dash-content">
            
            <div className="dash-header">
              <div>
                <h1 className="dash-title">Overview</h1>
                <p className="dash-subtitle">All the workflows, credentials and data tables you have access to</p>
              </div>
              <div className="dash-header-actions">
                <button className="dash-btn-secondary"><Download size={14} /> Import Workflow</button>
                <button className="dash-btn-secondary"><Clock size={14} /> Open Recent</button>
                <button className="dash-btn-primary" onClick={handleCreate}><Plus size={14} /> Create Workflow</button>
              </div>
            </div>

            <div className="dash-runtime-pill">
              ● Local Runtime Connected
            </div>

            {/* KPI GRID */}
            <div className="dash-kpi-grid">
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Production Executions</div>
                  <Activity size={14} className="dash-kpi-icon" style={{ color: 'var(--accent-purple)' }} />
                </div>
                <div className="dash-kpi-value">34</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--success)' }}><TrendingUp size={12} /> 12% vs last 7 days</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Failed Executions</div>
                  <XCircle size={14} className="dash-kpi-icon" style={{ color: 'var(--error)' }} />
                </div>
                <div className="dash-kpi-value">34</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--error)' }}><TrendingUp size={12} /> 8%</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Failure Rate</div>
                  <AlertTriangle size={14} className="dash-kpi-icon" style={{ color: 'var(--error)' }} />
                </div>
                <div className="dash-kpi-value">100%</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--text-muted)' }}>↗ 0%</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Time Saved</div>
                  <Clock size={14} className="dash-kpi-icon" style={{ color: 'var(--success)' }} />
                </div>
                <div className="dash-kpi-value">--</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--text-muted)' }}>No data yet</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Average Run Time</div>
                  <TrendingDown size={14} className="dash-kpi-icon" style={{ color: 'var(--accent-purple)' }} />
                </div>
                <div className="dash-kpi-value">0.11s</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--success)' }}><TrendingDown size={12} /> 5%</div>
              </div>
            </div>

            {/* WORKSPACE GRID */}
            <div className="dash-workspace-grid">
              
              {/* MAIN PANEL */}
              <div className="dash-main-panel">
                <div className="dash-tabs">
                  <div className={`dash-tab ${activeTab === 'workflows' ? 'active' : ''}`} onClick={() => setActiveTab('workflows')}>Workflows</div>
                  <div className={`dash-tab ${activeTab === 'credentials' ? 'active' : ''}`} onClick={() => setActiveTab('credentials')}>Credentials</div>
                  <div className={`dash-tab ${activeTab === 'executions' ? 'active' : ''}`} onClick={() => setActiveTab('executions')}>Executions</div>
                  <div className={`dash-tab ${activeTab === 'variables' ? 'active' : ''}`} onClick={() => setActiveTab('variables')}>Variables</div>
                  <div className={`dash-tab ${activeTab === 'tables' ? 'active' : ''}`} onClick={() => setActiveTab('tables')}>Data Tables</div>
                </div>

                {activeTab === 'workflows' && (
                  <>
                    <div className="dash-table-toolbar">
                      <input 
                        type="text" 
                        placeholder="Search workflows..." 
                        className="dash-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="dash-filter-btn">All Workflows</button>
                        <button className="dash-filter-btn">Last Updated</button>
                        <button className="dash-filter-btn"><LayoutTemplate size={14} /></button>
                        <button className="dash-filter-btn"><Workflow size={14} /></button>
                      </div>
                    </div>

                    <div className="dash-table-container">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                            <th>Executions</th>
                            <th>Success Rate</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWorkflows.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No workflows found. Click "Create Workflow" to start.
                              </td>
                            </tr>
                          ) : (
                            filteredWorkflows.map((wf) => (
                              <tr key={wf.id} onClick={() => handleRowClick(wf.id)}>
                                <td>
                                  <div className="dash-wf-name">{wf.name}</div>
                                      <div className="dash-wf-desc">{wf.description}</div>
                                </td>
                                <td>
                                  <span className={`dash-status-badge status-${wf.status.toLowerCase()}`}>
                                    ● {wf.status}
                                  </span>
                                </td>
                                <td>{wf.updatedAt}</td>
                                <td>{wf.executions}</td>
                                <td style={{ color: 'var(--success)' }}>{wf.successRate}%</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="dash-row-actions">
                                    <button className="dash-action-btn" title="Run"><Play size={14} /></button>
                                    <button className="dash-action-btn" title="Analytics"><Activity size={14} /></button>
                                    <button className="dash-action-btn" title="Duplicate"><Copy size={14} /></button>
                                    <button className="dash-action-btn" title="More"><MoreHorizontal size={14} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {activeTab !== 'workflows' && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No data available for {activeTab} yet.
                  </div>
                )}
              </div>

              {/* RIGHT RAIL */}
              <div className="dash-right-rail">
                
                <div className="dash-rail-card">
                  <div className="dash-rail-header">
                    <div className="dash-rail-title">Recent Executions</div>
                    <span className="dash-rail-link">View all</span>
                  </div>
                  <div className="dash-activity-item">
                    <div className="dash-activity-icon" style={{ color: 'var(--success)' }}><CheckCircle size={14} /></div>
                    <div className="dash-activity-text">
                      <div className="dash-activity-title">Customer Churn Pipeline</div>
                      <div className="dash-activity-time">Success · 2m 34s</div>
                    </div>
                  </div>
                  <div className="dash-activity-item">
                    <div className="dash-activity-icon" style={{ color: 'var(--warning)' }}><Clock size={14} /></div>
                    <div className="dash-activity-text">
                      <div className="dash-activity-title">Fraud Detection</div>
                      <div className="dash-activity-time">Running · 3m 02s</div>
                    </div>
                  </div>
                  <div className="dash-activity-item">
                    <div className="dash-activity-icon" style={{ color: 'var(--error)' }}><XCircle size={14} /></div>
                    <div className="dash-activity-text">
                      <div className="dash-activity-title">Data Cleaning Pipeline</div>
                      <div className="dash-activity-time">Failed · 4m 03s</div>
                    </div>
                  </div>
                </div>

                <div className="dash-rail-card">
                  <div className="dash-rail-header">
                    <div className="dash-rail-title">Activity Feed</div>
                  </div>
                  <div className="dash-activity-item">
                    <div className="dash-activity-icon"><Brain size={14} /></div>
                    <div className="dash-activity-text">
                      <div className="dash-activity-title">Random Forest v3 registered</div>
                      <div className="dash-activity-time">24 minutes ago</div>
                    </div>
                  </div>
                  <div className="dash-activity-item">
                    <div className="dash-activity-icon"><FileText size={14} /></div>
                    <div className="dash-activity-text">
                      <div className="dash-activity-title">Telco_Churn.csv imported</div>
                      <div className="dash-activity-time">8 minutes ago</div>
                    </div>
                  </div>
                </div>

                <div className="dash-templates-card">
                  <div className="dash-templates-title">Explore Templates</div>
                  <div className="dash-templates-subtitle">Kickstart your ML pipeline.</div>
                  <div className="dash-template-grid">
                    <button className="dash-template-btn">Churn</button>
                    <button className="dash-template-btn">Regression</button>
                    <button className="dash-template-btn">Classification</button>
                    <button className="dash-template-btn">NLP</button>
                  </div>
                  <button className="dash-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>View All <ArrowRight size={14} /></button>
                </div>

              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;