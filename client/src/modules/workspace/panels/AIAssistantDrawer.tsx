// client/src/modules/workspace/panels/AIAssistantDrawer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { useWorkflowStore } from '../store/workflowStore';

export default function AIAssistantDrawer({ onClose, width }: { onClose: () => void; width: number }) {
  const { messages, sendMessage, isThinking } = useAiAssistant();
  const { nodes, selectedNodeId } = useWorkflowStore();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const quickActions = selectedNode 
    ? [`Explain ${selectedNode.data.title}`, `Why is ${selectedNode.data.title} failing?`, `Tune ${selectedNode.data.title} hyperparameters`]
    : ['Explain pipeline', 'Detect data leakage', 'Suggest preprocessing'];

  return (
    <div style={{
      position: 'absolute', right: 0, top: 120, bottom: 32, width: width, 
      background: 'var(--color-surface-1)', borderLeft: '1px solid var(--border)',
      zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)'
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={18} color="var(--accent-purple)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>AI Assistant</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ML Copilot {selectedNode ? `· Context: ${selectedNode.data.title}` : ''}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Close (Esc)">
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            <p>Hello! 👋 I can help you build and debug your ML pipeline.</p>
            <div style={{ marginTop: '16px', fontWeight: 600, marginBottom: '8px' }}>Suggested actions:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickActions.map(action => (
                <button key={action} onClick={() => sendMessage(action)} style={{ textAlign: 'left', background: 'var(--color-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--color-surface-2)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                padding: '10px 14px', borderRadius: '8px', maxWidth: '85%', fontSize: '13px'
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isThinking && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Thinking...</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your pipeline..."
          style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '13px' }}
        />
        <button type="submit" style={{ background: 'var(--accent-purple)', color: 'white', border: 'none', padding: '0 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}