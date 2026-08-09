import { useState } from 'react';
import { nodeCatalog } from '../config/nodeCatalog';
import { useWorkflowStore } from '../store/workflowStore'; // Fixed import path

export default function NodePanel() {
  const { addNode, toggleNodePanel } = useWorkflowStore();
  const [search, setSearch] = useState('');

  const filteredNodes = Object.entries(nodeCatalog).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = filteredNodes.reduce((acc, [name, config]) => {
    const cat = config.data.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ name, config });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <aside style={{ width: 300, flexShrink: 0, background: '#111', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #222' }}>
        <input 
          type="text" 
          placeholder="Search nodes..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', background: '#0d0d0d', border: '1px solid #333', color: '#fff', padding: '8px 10px', borderRadius: '4px', outline: 'none', fontSize: '13px' }} 
        />
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(categories).map(([category, nodes]) => (
          <div key={category}>
            <div style={{ padding: '10px 14px', background: '#161616', borderBottom: '1px solid #222', fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
              {category}
            </div>
            {nodes.map(({ name, config }) => (
              <div 
                key={name} 
                onClick={() => addNode(config.data, { x: 100 + Math.random() * 200, y: 100 + Math.random() * 100 })}
                style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #1a1a1a', color: '#ddd', fontSize: '13px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>{name}</span>
                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', background: '#222', color: config.data.categoryColor, border: `1px solid ${config.data.categoryColor}33` }}>
                  {config.data.outputType || 'None'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => toggleNodePanel(false)} 
        style={{ padding: '10px', background: '#1a1a1a', border: 'none', borderTop: '1px solid #222', color: '#888', cursor: 'pointer', fontSize: '12px' }}
      >
        Close
      </button>
    </aside>
  );
}