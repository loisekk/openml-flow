import React from 'react';
import { MLNodeData } from '../config/nodeCatalog';

const mockLineage = [
  { id: '1', title: 'Load CSV', color: '#64B5F6' },
  { id: '2', title: 'Drop Nulls', color: '#FFA931' },
  { id: '3', title: 'Encode Categorical', color: '#B39DDB' },
];

export default function DataLineage({ currentNode }: { currentNode: MLNodeData }) {
  return (
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
      <div style={{ padding: '6px 12px', background: `${currentNode.categoryColor}22`, borderRadius: '6px', border: `1px solid ${currentNode.categoryColor}`, color: '#fff', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(255,138,0,0.3)' }}>
        ▶ {currentNode.title}
      </div>
    </div>
  );
}