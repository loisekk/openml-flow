// client/src/modules/settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Workflow, LayoutTemplate, Download, Database, Table2, Brain, Box,
  Rocket, ScrollText, AlertTriangle, KeyRound, Lock, Globe, Settings as SettingsIcon,
  Search, Bell, Cpu, Plus, CheckCircle, Package, Terminal, Upload, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useSettingsStore } from './useSettingsStore';
import '../dashboard/Dashboard.css';

const Settings = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const { providers, fetchProviders, addProvider, activateProvider } = useSettingsStore();
  
  const [activeSettingsTab, setActiveSettingsTab] = useState('environment');
  
  // Environment State
  const [packages, setPackages] = useState<any[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [installPackage, setInstallPackage] = useState('');
  const [installing, setInstalling] = useState(false);
  const [installMsg, setInstallMsg] = useState('');
  const [pkgSearchQuery, setPkgSearchQuery] = useState('');
  const [showAllPackages, setShowAllPackages] = useState(false); 

  // AI Provider State
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');

  const fetchPackages = async () => {
    setLoadingPkgs(true);
    try {
      const res = await fetch('/api/environment/packages');
      const data = await res.json();
      if (data.packages) setPackages(data.packages);
    } catch (err) {
      console.error('Failed to fetch packages', err);
    } finally {
      setLoadingPkgs(false);
    }
  };

  useEffect(() => {
    if (token) fetchProviders(token);
    fetchPackages();
  }, [token]);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installPackage.trim()) return;
    setInstalling(true);
    setInstallMsg(`Installing ${installPackage}...`);
    try {
      const res = await fetch('/api/environment/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: installPackage })
      });
      const data = await res.json();
      if (data.success) {
        setInstallMsg(`✓ Successfully installed ${installPackage}`);
        fetchPackages(); 
        setInstallPackage('');
      } else {
        setInstallMsg(`✕ Installation failed: ${data.error?.substring(0, 200)}`);
      }
    } catch (err) {
      setInstallMsg('✕ Failed to connect to runtime.');
    } finally {
      setInstalling(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProvider(token!, { name, baseUrl, apiKey, model, isActive: providers.length === 0 });
    setName(''); setApiKey('');
  };

  // Define categories for known core packages
  const categoryMap: Record<string, string[]> = {
    'Machine Learning': ['scikit-learn', 'numpy', 'scipy', 'xgboost', 'lightgbm', 'catboost', 'imbalanced-learn', 'joblib'],
    'Data Processing': ['pandas', 'polars', 'pyarrow'],
    'Web & API': ['fastapi', 'uvicorn', 'starlette', 'pydantic', 'openai', 'requests', 'python-multipart', 'python-jose'],
    'Visualization': ['matplotlib', 'seaborn', 'plotly', 'altair'],
    'Core & Utilities': ['pip', 'setuptools', 'wheel', 'sqlalchemy']
  };

  const systemDeps = [
    'anyio', 'certifi', 'charset-normalizer', 'click', 'colorama', 'distro', 
    'h11', 'httpcore', 'httpx', 'idna', 'jinja2', 'markupsafe', 'sniffio', 
    'typing-extensions', 'urllib3', 'tzdata', 'pyyaml', 'six', 'python-dateutil'
  ];

  const knownPackageNames = Object.values(categoryMap).flat();
  const categorizedPackages = Object.keys(categoryMap).map(cat => ({
    category: cat,
    packages: packages.filter(p => categoryMap[cat].includes(p.name.toLowerCase()))
  })).filter(group => group.packages.length > 0);
  
  const otherPackages = packages.filter(p => 
    !knownPackageNames.includes(p.name.toLowerCase()) && 
    !systemDeps.includes(p.name.toLowerCase())
  );

  const hiddenSystemPackages = packages.filter(p => 
    !knownPackageNames.includes(p.name.toLowerCase()) && 
    systemDeps.includes(p.name.toLowerCase())
  );

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(pkgSearchQuery.toLowerCase())
  );

  return (
    <div className="dash-app-shell">
      {/* GLOBAL TOP NAV */}
      <header className="dash-global-header" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="dash-brand">
          <span className="dash-brand-icon">◈</span> open-mlpipe
          <span className="dash-brand-badge">ULTIMATE STUDIO</span>
        </div>
        <nav className="dash-top-nav">
          <div className="dash-top-nav-item" onClick={() => navigate('/dashboard')}>Studio</div>
          <div className="dash-top-nav-item">Models</div>
          <div className="dash-top-nav-item">Datasets</div>
          <div className="dash-top-nav-item">Pipelines</div>
          <div className="dash-top-nav-item">Experiments</div>
          <div className="dash-top-nav-item">Deployments</div>
        </nav>
        <div className="dash-header-right">
          <div className="dash-search-btn"><Search size={14} /><span>Search...</span><kbd>⌘K</kbd></div>
          <button className="dash-icon-btn"><Bell size={16} /></button>
          <button className="dash-icon-btn"><SettingsIcon size={16} /></button>
        </div>
      </header>

      <div className="dash-shell">
        {/* SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="dash-sidebar-section">Settings</div>
          <div 
            className={`dash-sidebar-item ${activeSettingsTab === 'environment' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('environment')}
          >
            <Package size={16} /> Environment
          </div>
          <div 
            className={`dash-sidebar-item ${activeSettingsTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('providers')}
          >
            <Lock size={16} /> AI Providers
          </div>
          <div className="dash-sidebar-item" onClick={() => navigate('/dashboard')}><Home size={16} /> Back to Dashboard</div>

          <div className="dash-runtime-card">
            <div className="dash-runtime-header">
              <span>Local Runtime</span>
              <span style={{ color: 'var(--success)' }}>● Connected</span>
            </div>
            <div className="dash-runtime-metric">
              <div className="dash-runtime-metric-label"><span>CPU</span><span>24%</span></div>
              <div className="dash-runtime-bar"><div className="dash-runtime-bar-fill" style={{ width: '24%', background: 'var(--accent-cyan)' }}></div></div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="dash-main">
          <div className="dash-content">
            
            {activeSettingsTab === 'environment' && (
              <>
                <div className="dash-header">
                  <div>
                    <h1 className="dash-title">Python Environment</h1>
                    <p className="dash-subtitle">Manage local packages and dependencies.</p>
                  </div>
                </div>

                {/* Premium Install Section - Single Row */}
                <div className="dash-main-panel" style={{ marginBottom: '24px' }}>
                  <div className="dash-panel-header">
                    <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={18} color="var(--accent-purple)" /> Install Package
                    </h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <form onSubmit={handleInstall} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '0 16px',
                        height: '44px'
                      }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                          type="text"
                          value={installPackage}
                          onChange={(e) => setInstallPackage(e.target.value)}
                          placeholder="e.g., xgboost==2.0.3 or tensorflow"
                          style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0 12px', outline: 'none', fontSize: '14px' }}
                          disabled={installing}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="dash-btn-primary" 
                        disabled={installing} 
                        style={{ minWidth: '160px', height: '44px', justifyContent: 'center' }}
                      >
                        {installing ? 'Installing...' : <><Upload size={16} /> Install Package</>}
                      </button>
                    </form>
                    {installMsg && (
                      <div style={{ 
                        marginTop: '16px', 
                        background: 'var(--bg-primary)', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        fontFamily: 'monospace', 
                        fontSize: '13px', 
                        color: installMsg.startsWith('✓') ? 'var(--success)' : 'var(--text-secondary)', 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-all', 
                        border: '1px solid var(--border)' 
                      }}>
                        {installMsg}
                      </div>
                    )}
                  </div>
                </div>

                {/* Installed Packages Section */}
                <div className="dash-main-panel">
                  <div className="dash-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Installed Packages ({packages.length})</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 12px', height: '32px' }}>
                        <Search size={14} color="var(--text-muted)" />
                        <input 
                          type="text" 
                          placeholder="Search packages..." 
                          value={pkgSearchQuery}
                          onChange={(e) => setPkgSearchQuery(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0 8px', outline: 'none', fontSize: '13px', width: '200px', height: '100%' }}
                        />
                      </div>
                      <button onClick={fetchPackages} className="dash-btn-secondary" style={{ height: '32px', padding: '0 14px', display: 'flex', alignItems: 'center' }}>Refresh</button>
                    </div>
                  </div>
                  <div className="dash-table-container">
                    {loadingPkgs ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading packages...</div>
                    ) : pkgSearchQuery ? (
                      // SEARCH RESULTS VIEW
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Package Name</th>
                            <th>Version</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPackages.length === 0 ? (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                No packages match your search.
                              </td>
                            </tr>
                          ) : (
                            filteredPackages.map((pkg, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pkg.name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{pkg.version}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : (
                      // CATEGORIZED VIEW
                      <div style={{ padding: '8px 0' }}>
                        {categorizedPackages.map((group, gIdx) => (
                          <div key={gIdx} style={{ marginBottom: '4px' }}>
                            <div style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                              {group.category}
                            </div>
                            <table className="dash-table">
                              <tbody>
                                {group.packages.map((pkg, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', padding: '12px 20px' }}>{pkg.name}</td>
                                    <td style={{ color: 'var(--text-secondary)', padding: '12px 20px' }}>{pkg.version}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}

                        {/* User Installed / Other Packages Section */}
                        {otherPackages.length > 0 && (
                          <div style={{ marginBottom: '4px' }}>
                            <div style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-purple)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                              User Installed / Other
                            </div>
                            <table className="dash-table">
                              <tbody>
                                {otherPackages.map((pkg, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', padding: '12px 20px' }}>{pkg.name}</td>
                                    <td style={{ color: 'var(--text-secondary)', padding: '12px 20px' }}>{pkg.version}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Hidden System Dependencies Toggle (183 packages at the bottom) */}
                        <div style={{ marginTop: '16px', padding: '0 20px' }}>
                          <button 
                            onClick={() => setShowAllPackages(!showAllPackages)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}
                          >
                            {showAllPackages ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            {showAllPackages ? 'Hide' : 'Show'} Background System Dependencies ({hiddenSystemPackages.length})
                          </button>
                        </div>

                        {showAllPackages && (
                          <table className="dash-table" style={{ marginTop: '8px' }}>
                            <tbody>
                              {hiddenSystemPackages.map((pkg, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 500, color: 'var(--text-secondary)', padding: '10px 20px', fontSize: '13px' }}>{pkg.name}</td>
                                  <td style={{ color: 'var(--text-muted)', padding: '10px 20px', fontSize: '12px' }}>{pkg.version}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeSettingsTab === 'providers' && (
              <>
                <div className="dash-header">
                  <div>
                    <h1 className="dash-title">AI Providers (BYOK)</h1>
                    <p className="dash-subtitle">Bring your own key. Supports OpenAI, Groq, Ollama, etc.</p>
                  </div>
                </div>
                
                <div className="dash-settings-grid">
                  {/* Add Provider Form */}
                  <div className="dash-panel">
                    <div className="dash-panel-header"><h3 style={{ margin: 0, fontSize: '16px' }}>Add New Provider</h3></div>
                    <form onSubmit={handleAddProvider} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Provider Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="OpenAI / Groq / Local Ollama" style={inputStyle} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Base URL</label>
                        <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={inputStyle} required />
                      </div>
                      <div>
                        <label style={labelStyle}>API Key</label>
                        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-... (use 'ollama' for local)" style={inputStyle} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Default Model</label>
                        <input value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-3.5-turbo / llama3" style={inputStyle} required />
                      </div>
                      <button type="submit" className="dash-btn-primary"><Plus size={14} /> Add Provider</button>
                    </form>
                  </div>

                  {/* Provider List */}
                  <div className="dash-panel">
                    <div className="dash-panel-header"><h3 style={{ margin: 0, fontSize: '16px' }}>Connected Providers</h3></div>
                    <div style={{ padding: '20px' }}>
                      {providers.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>No providers configured yet.</span>
                      ) : (
                        providers.map(p => (
                          <div key={p.id} className={`dash-provider-row ${p.isActive ? 'dash-provider-active' : ''}`}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {p.name} 
                                {p.isActive && <span style={{ color: 'var(--success)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Active</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.baseUrl} | Model: {p.model}</div>
                            </div>
                            {!p.isActive && (
                              <button className="dash-btn-secondary" onClick={() => activateProvider(token!, p.id)}>Set Active</button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none' };

export default Settings;