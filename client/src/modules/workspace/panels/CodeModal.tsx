import { useState } from 'react';
import { useCodeGenerator } from '../hooks/useCodeGenerator';

export default function CodeModal({ onClose }: { onClose: () => void }) {
  const code = useCodeGenerator();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', width: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Generated Python Code</h3>
          <button onClick={onClose} style={{ background: '#161616', border: '1px solid #222', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: '#0d0d0d', borderRadius: '4px', border: '1px solid #333' }}>
            <div style={{ padding: '10px 15px', background: '#111', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: '12px' }}>generated_pipeline.py</span>
              <button onClick={handleCopy} style={{ background: '#333', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <pre style={{ margin: 0, padding: '15px', color: '#d4d4d4', fontFamily: 'Courier New, monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}