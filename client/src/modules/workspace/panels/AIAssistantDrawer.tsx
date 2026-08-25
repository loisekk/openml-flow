// client/src/modules/workspace/panels/AIAssistantDrawer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, ChevronDown } from 'lucide-react';
import { useAiAssistant } from '../hooks/useAiAssistant';
import { useWorkflowStore } from '../store/workflowStore';
import { useSettingsStore } from '../../settings/useSettingsStore';
import { useAuthStore } from '../../auth/authStore';

export default function AIAssistantDrawer({ onClose, width }: { onClose: () => void; width: number }) {
  const { messages, sendMessage, isThinking } = useAiAssistant();
  const { nodes, selectedNodeId } = useWorkflowStore();
  const { providers, fetchProviders, activateProvider } = useSettingsStore();
  const { token } = useAuthStore();
  const [input, setInput] = useState('');
  const [switchingModel, setSwitchingModel] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const activeProvider = providers.find(p => p.isActive);

  useEffect(() => {
    if (token) fetchProviders(token);
  }, [token, fetchProviders]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); setShowModelDropdown(false); }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.model-switcher')) setShowModelDropdown(false);
    };
    if (showModelDropdown) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showModelDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleModelSwitch = async (providerId: number) => {
    if (!token || switchingModel) return;
    setSwitchingModel(true);
    setShowModelDropdown(false);
    await activateProvider(token, providerId);
    setSwitchingModel(false);
  };

  const quickActions = selectedNode
    ? [`Explain ${selectedNode.data.title}`, `Why is ${selectedNode.data.title} failing?`, `Tune ${selectedNode.data.title} hyperparameters`]
    : ['Build a workflow for this dataset', 'Explain pipeline', 'Detect data leakage'];

  return (
    <div style={{
      position: 'absolute', right: 0, top: 120, bottom: 32, width: width,
      background: 'var(--color-surface-1)', borderLeft: '1px solid var(--border)',
      zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)'
    }}>
      {/* Header with Model Switcher */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={18} color="var(--accent-purple)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>AI Assistant</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            ML Copilot {selectedNode ? `· Context: ${selectedNode.data.title}` : ''}
          </div>
        </div>

        {/* Model Switcher Dropdown */}
        <div className="model-switcher" style={{ position: 'relative' }}>
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            disabled={switchingModel || providers.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--color-surface-2)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '6px 10px', cursor: 'pointer',
              fontSize: '11px', color: 'var(--text-secondary)',
              opacity: switchingModel ? 0.5 : 1, maxWidth: '180px',
            }}
            title="Switch AI model"
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {switchingModel ? 'Switching...' : (activeProvider ? `${activeProvider.name} · ${activeProvider.model}` : 'No model')}
            </span>
            <ChevronDown size={12} color="var(--text-muted)" />
          </button>

          {showModelDropdown && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
              background: 'var(--color-surface-2)', border: '1px solid var(--border)',
              borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100,
              minWidth: '220px', maxHeight: '300px', overflowY: 'auto',
            }}>
              {providers.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  No providers configured. Go to Settings → AI Providers.
                </div>
              ) : (
                providers.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleModelSwitch(p.id)}
                    style={{
                      padding: '10px 12px', cursor: 'pointer', fontSize: '12px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      borderBottom: '1px solid var(--border)',
                      background: p.isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!p.isActive) e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                    onMouseLeave={(e) => { if (!p.isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.model}
                      </div>
                    </div>
                    {p.isActive && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                    )}
                  </div>
                ))
              )}
              {/* Add new provider hint */}
              <div
                onClick={() => { window.location.href = '/settings'; }}
                style={{
                  padding: '10px 12px', cursor: 'pointer', fontSize: '11px',
                  color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                + Add new provider (Settings)
              </div>
            </div>
          )}
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
                <button key={action} onClick={() => sendMessage(action)} style={{
                  textAlign: 'left', background: 'var(--color-surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                }}>
                  {action.startsWith('Build') ? '🏗️ ' : '💡 '}{action}
                </button>
              ))}
            </div>
            {providers.length === 0 && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', fontSize: '11px', color: 'var(--error)' }}>
                ⚠️ No AI provider configured. Go to Settings → AI Providers to add your API key first.
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--color-surface-2)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                padding: '10px 14px', borderRadius: '8px', maxWidth: '85%', fontSize: '13px',
                wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isThinking && (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)', animation: 'pulse 1s infinite' }} />
            Thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything or 'Build a workflow for this dataset'..."
          style={{
            flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '13px',
          }}
        />
        <button type="submit" disabled={isThinking} style={{
          background: 'var(--accent-purple)', color: 'white', border: 'none',
          padding: '0 12px', borderRadius: '6px', cursor: isThinking ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isThinking ? 0.6 : 1,
        }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}