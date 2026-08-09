// client/src/modules/workspace/panels/NodeLibraryPanel.tsx
import React, { useState, useRef } from 'react';
import { nodeCategories, nodeRegistry } from '../config/nodeRegistry';
import { useWorkflowStore } from '../store/workflowStore';

export default function NodeLibraryPanel() {
  const { addNode } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Data Loading']);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleAddNode = (type: string) => {
    const nodeDef = nodeRegistry[type];
    if (!nodeDef) return;
    addNode({ ...nodeDef, status: 'idle' }, { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 });
  };

  // Cmd+K / Ctrl+K to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside className="uw-left-panel" style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
      <div className="uw-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Node Library</span>
      </div>
      <input 
        ref={searchInputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="uw-search" 
        placeholder="Search nodes... (⌘K)" 
        style={{ margin: '12px', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', flexShrink: 0 }} 
      />
      
      <div className="uw-node-list" style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {searchQuery ? (
          // SEARCH RESULTS VIEW
          <div style={{ padding: '4px' }}>
            {Object.entries(nodeRegistry)
              .filter(([key, nodeDef]) => 
                nodeDef.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                nodeDef.category.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(([key, nodeDef]) => (
                <div 
                  key={key} 
                  onClick={() => handleAddNode(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                    borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--panel-bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
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
          // ACCORDION CATEGORY VIEW
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
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel-bg-hover)'}
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
                        <div 
                          key={nodeDef.title} 
                          onClick={() => handleAddNode(type)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                            borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--panel-bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
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
  );
}