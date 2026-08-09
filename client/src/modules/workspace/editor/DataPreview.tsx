import React from 'react';

export default function DataPreview() {
  return (
    <>
      <h3 style={panelHeaderStyle}>Incoming Dataset</h3>
      <div style={{ padding: '16px' }}>
        <div style={statGrid}>
          <div style={statCard}><span>Rows</span><strong>10,000</strong></div>
          <div style={statCard}><span>Columns</span><strong>25</strong></div>
          <div style={statCard}><span>Memory</span><strong>1.2MB</strong></div>
          <div style={statCard}><span>Missing</span><strong>0.5%</strong></div>
        </div>
        
        <h4 style={{ marginTop: '24px', color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>Preview (First 5 Rows)</h4>
        <div style={{ marginTop: '8px', background: '#0d0d0d', borderRadius: '8px', border: '1px solid #222', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                <th style={thStyle}>age</th>
                <th style={thStyle}>income</th>
                <th style={thStyle}>city</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={tdStyle}>34</td><td style={tdStyle}>50000</td><td style={tdStyle}>NY</td></tr>
              <tr><td style={tdStyle}>45</td><td style={tdStyle}>82000</td><td style={tdStyle}>LA</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const panelHeaderStyle: React.CSSProperties = { margin: 0, padding: '16px', borderBottom: '1px solid #222', color: '#fff', fontSize: '14px' };
const statGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' };
const statCard: React.CSSProperties = { background: '#0d0d0d', padding: '8px', borderRadius: '6px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '4px' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px', borderBottom: '1px solid #222', color: '#888', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '8px', borderBottom: '1px solid #1a1a1a', color: '#ddd' };