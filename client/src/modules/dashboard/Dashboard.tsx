// client/src/modules/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Workflow, LayoutTemplate, Download, Database, Table2, Brain, Box,
  Rocket, ScrollText, AlertTriangle, KeyRound, Lock, Globe, Settings,
  Search, Bell, Cpu, Plus, Play, Copy, MoreHorizontal, CheckCircle, Clock,
  Activity, FileText, TrendingUp, ArrowRight, Trash2
} from 'lucide-react';
import { useDashboardStore } from './useDashboardStore';
import { useAuthStore } from '../auth/authStore';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { workflows, isLoading, error, fetchWorkflows, createWorkflow, deleteWorkflow } = useDashboardStore();
  const { token, logout, username } = useAuthStore();

  const [activeTab, setActiveTab] = useState('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch REAL workflows from the backend on mount (and after login).
  useEffect(() => {
    if (token) fetchWorkflows(token);
  }, [token, fetchWorkflows]);

  const handleCreate = async () => {
    if (!token || creating) return;
    setCreating(true);
    const id = await createWorkflow(token);
    setCreating(false);
    if (id) navigate(`/workspace/${id}`);
    // On failure the store sets `error`, rendered below.
  };

  const handleRowClick = (id: number) => {
    navigate(`/workspace/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, wfId: number, wfName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${wfName}"? This cannot be undone.`)) return;
    if (token) await deleteWorkflow(token, wfId);
  };

  const filteredWorkflows = workflows.filter(wf =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Honest KPIs derived from real data (no more mock "100% failure rate").
  const activeCount = workflows.filter(wf => wf.status === 'Active').length;
  const draftCount = workflows.length - activeCount;
  const totalNodes = workflows.reduce((sum, wf) => sum + (wf.nodeCount || 0), 0);
  const recentWorkflows = workflows.slice(0, 3);

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
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-surface-2)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {(username || 'U').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '12px' }}>{username || 'User'}</span>
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
                <button className="dash-btn-primary" onClick={handleCreate} disabled={creating} style={{ opacity: creating ? 0.7 : 1 }}>
                  <Plus size={14} /> {creating ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--error-bg, rgba(239,68,68,0.12))', border: '1px solid rgba(239,68,68,0.28)', color: 'var(--error, #EF4444)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div className="dash-runtime-pill">
              ● Local Runtime Connected
            </div>

            {/* KPI GRID — derived from real workflow data */}
            <div className="dash-kpi-grid">
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Total Workflows</div>
                  <Workflow size={14} className="dash-kpi-icon" style={{ color: 'var(--accent-purple)' }} />
                </div>
                <div className="dash-kpi-value">{workflows.length}</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--text-muted)' }}>Saved in your local database</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Active Pipelines</div>
                  <CheckCircle size={14} className="dash-kpi-icon" style={{ color: 'var(--success)' }} />
                </div>
                <div className="dash-kpi-value">{activeCount}</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--success)' }}>Workflows with nodes</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Drafts</div>
                  <Clock size={14} className="dash-kpi-icon" style={{ color: 'var(--accent-blue, #3B82F6)' }} />
                </div>
                <div className="dash-kpi-value">{draftCount}</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--text-muted)' }}>Empty workflows</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Nodes Built</div>
                  <Brain size={14} className="dash-kpi-icon" style={{ color: 'var(--accent-purple)' }} />
                </div>
                <div className="dash-kpi-value">{totalNodes}</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--text-muted)' }}>Across all pipelines</div>
              </div>
              <div className="dash-kpi-card">
                <div className="dash-kpi-header">
                  <div className="dash-kpi-label">Time Saved</div>
                  <TrendingUp size={14} className="dash-kpi-icon" style={{ color: 'var(--success)' }} />
                </div>
                <div className="dash-kpi-value">--</div>
                <div className="dash-kpi-trend" style={{ color: 'var(--text-muted)' }}>No data yet</div>
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
                          {isLoading ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                Loading workflows...
                              </td>
                            </tr>
                          ) : filteredWorkflows.length === 0 && !error ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                {searchQuery
                                  ? 'No workflows match your search.'
                                  : 'No workflows yet. Click "Create Workflow" to start building.'}
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
                                <td style={{ color: wf.successRate > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                  {wf.successRate > 0 ? `${wf.successRate}%` : '—'}
                                </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <div className="dash-row-actions">
                                    <button className="dash-action-btn" title="Run"><Play size={14} /></button>
                                    <button className="dash-action-btn" title="Analytics"><Activity size={14} /></button>
                                    <button className="dash-action-btn" title="Duplicate"><Copy size={14} /></button>
                                    <button
                                      className="dash-action-btn"
                                      title="Delete workflow"
                                      style={{ color: 'var(--error, #EF4444)' }}
                                      onClick={(e) => handleDelete(e, wf.id, wf.name)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
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
                  {recentWorkflows.length === 0 ? (
                    <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      No executions yet. Run a workflow to see its history here.
                    </div>
                  ) : (
                    recentWorkflows.map((wf) => (
                      <div key={wf.id} className="dash-activity-item">
                        <div className="dash-activity-icon" style={{ color: 'var(--text-muted)' }}><Activity size={14} /></div>
                        <div className="dash-activity-text">
                          <div className="dash-activity-title">{wf.name}</div>
                          <div className="dash-activity-time">{wf.nodeCount} node{wf.nodeCount === 1 ? '' : 's'} · {wf.updatedAt}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="dash-rail-card">
                  <div className="dash-rail-header">
                    <div className="dash-rail-title">Activity Feed</div>
                  </div>
                  {workflows.length === 0 ? (
                    <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Your activity will appear here as you build workflows.
                    </div>
                  ) : (
                    workflows.slice(0, 3).map((wf) => (
                      <div key={wf.id} className="dash-activity-item">
                        <div className="dash-activity-icon"><Workflow size={14} /></div>
                        <div className="dash-activity-text">
                          <div className="dash-activity-title">{wf.name} updated</div>
                          <div className="dash-activity-time">{wf.updatedAt}</div>
                        </div>
                      </div>
                    ))
                  )}
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