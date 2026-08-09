import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowStore } from '../../store/workflowStore';

const WorkflowNode = ({ id, data, selected }: NodeProps<any>) => {
  const { deleteNode, duplicateNode, setSelectedNodeId } = useWorkflowStore();
  const status = data.status || 'idle';

  // Dynamic border and glow based on execution status
  const getStatusStyles = () => {
    switch (status) {
      case 'running':
        return { border: '2px solid #FF8A00', boxShadow: '0 0 16px rgba(255, 138, 0, 0.6)', animation: 'pulse-orange 1.5s infinite' };
      case 'success':
        return { border: '2px solid #22C55E', boxShadow: '0 0 12px rgba(34, 197, 94, 0.4)' };
      case 'error':
        return { border: '2px solid #EF4444', boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)' };
      default:
        return { 
          border: selected ? `1px solid ${data.color}` : '1px solid rgba(255,255,255,0.08)', 
          boxShadow: selected ? `0 0 15px ${data.color}40` : '0 2px 8px rgba(0,0,0,0.3)' 
        };
    }
  };

  return (
    <div 
      style={{ position: 'relative' }}
      onClick={() => setSelectedNodeId(id)}
    >
      {/* Floating Toolbar */}
      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: -48,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#101727',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px',
              display: 'flex',
              gap: '2px',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <button style={btnStyle} title="Run">▶</button>
            <button style={btnStyle} title="Configure" onClick={() => setSelectedNodeId(id)}>⚙</button>
            <button style={btnStyle} title="View Code">📄</button>
            <button style={btnStyle} title="Duplicate" onClick={() => duplicateNode(id)}>⧉</button>
            <button style={{...btnStyle, color: '#EF4444'}} title="Delete" onClick={() => deleteNode(id)}>🗑</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node Body */}
      <div style={{
        background: '#101C30', 
        ...getStatusStyles(),
        borderRadius: '8px',
        width: '220px',
        transition: 'border-color 0.2s, box-shadow 0.2s', 
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: `${data.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px'
          }}>
            {data.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F4F7FB' }}>{data.title}</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>{data.category}</div>
          </div>
          {/* Status Dot */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: status === 'running' ? '#FF8A00' : status === 'success' ? '#22C55E' : status === 'error' ? '#EF4444' : '#475569',
            boxShadow: status === 'running' ? '0 0 8px #FF8A00' : 'none'
          }}></div>
        </div>

        {/* Body / Stats */}
        <div style={{ padding: '10px 12px', fontSize: '11px', color: '#94A3B8' }}>
          {status === 'running' ? (
            <div>Executing...</div>
          ) : status === 'success' ? (
            <div style={{ color: '#22C55E' }}>✓ Executed successfully</div>
          ) : status === 'error' ? (
            <div style={{ color: '#EF4444' }}>✕ Execution failed</div>
          ) : (
            <div>{data.description}</div>
          )}
        </div>
      </div>

      {/* Handles */}
      {data.inputs.map((input: string, i: number) => (
        <Handle
          key={input}
          type="target"
          position={Position.Left}
          id={input}
          style={{
            background: '#475569',
            border: 'none',
            width: '8px',
            height: '8px',
            top: 15 + (i * 20)
          }}
        />
      ))}
      
      {data.outputs.map((output: string, i: number) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          style={{
            background: data.color,
            border: 'none',
            width: '8px',
            height: '8px',
            top: 15 + (i * 20)
          }}
        />
      ))}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  color: '#8A94A6',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  transition: 'background 0.15s, color 0.15s'
};

export default React.memo(WorkflowNode);