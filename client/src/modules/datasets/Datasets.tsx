import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Workflow, LayoutTemplate, Download, Database, Table2, Brain, Box, Rocket, ScrollText, AlertTriangle, KeyRound, Lock, Globe, Settings as SettingsIcon, Search, Bell, Cpu, Upload, Trash2 } from 'lucide-react';
import '../dashboard/Dashboard.css';

const Datasets = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      const data = await res.json();
      setDatasets(data);
    } catch (error) {
      console.error('Failed to fetch datasets', error);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/dataset/upload', {
        method: 'POST',
        body: formData
      });
      fetchDatasets();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dash-app-shell">
      {/* GLOBAL TOP NAV */}
      <header className="dash-global-header">
        <div className="dash-brand">
          <span className="dash-brand-icon">◈</span> open-mlpipe
          <span className="dash-brand-badge">ULTIMATE STUDIO</span>
        </div>
        <nav className="dash-top-nav">
          <div className="dash-top-nav-item" onClick={() => navigate('/dashboard')}>Studio</div>
          <div className="dash-top-nav-item">Models</div>
          <div className="dash-top-nav-item active">Datasets</div>
          <div className="dash-top-nav-item">Pipelines</div>
          <div className="dash-top-nav-item">Experiments</div>
          <div className="dash-top-nav-item">Deployments</div>
        </nav>
        <div className="dash-header-right">
          <div className="dash-search-btn"><Search size={14} /><span>Search...</span><kbd>⌘K</kbd></div>
          <button className="dash-icon-btn"><Bell size={16} /></button>
          <button className="dash-icon-btn" onClick={() => navigate('/settings')}><SettingsIcon size={16} /></button>
        </div>
      </header>

      <div className="dash-shell">
        {/* SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-section">Home</div>
          <div className="dash-sidebar-item" onClick={() => navigate('/dashboard')}><Home size={16} /> Home</div>
          
          <div className="dash-sidebar-section">Project</div>
          <div className="dash-sidebar-item"><Workflow size={16} /> Workflows</div>
          <div className="dash-sidebar-item"><LayoutTemplate size={16} /> Templates</div>
          <div className="dash-sidebar-item"><Download size={16} /> Imports</div>
          
          <div className="dash-sidebar-section">Data</div>
          <div className="dash-sidebar-item active"><Database size={16} /> Datasets</div>
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
          <div className="dash-sidebar-item"><SettingsIcon size={16} /> Settings</div>

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
                <h1 className="dash-title">Local Datasets</h1>
                <p className="dash-subtitle">Manage datasets stored on your local machine.</p>
              </div>
              <div className="dash-header-actions">
                <label className="dash-btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Dataset'}
                  <input type="file" accept=".csv,.json,.xlsx" onChange={handleUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="dash-main-panel" style={{ marginTop: '24px' }}>
              <div className="dash-tabs">
                <div className="dash-tab active">All Datasets</div>
              </div>
              <div className="dash-table-container">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Local Path</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No datasets uploaded yet. Click "Upload Dataset" to add one.
                        </td>
                      </tr>
                    ) : (
                      datasets.map((ds, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="dash-wf-name">{ds.name}</div>
                          </td>
                          <td>{ds.size}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{ds.path}</td>
                          <td>
                            <button className="dash-action-btn danger" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Datasets;