// client/src/modules/workspace/canvas/nodes/NoteNode.tsx
// Documentation node: a themed sticky note on the canvas. Never executes —
// codegen and the validator skip it. Text persists like any node data (v1.1.4).
import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useWorkflowStore } from '../../store/workflowStore';

const NoteNode = ({ id, data, selected }: NodeProps<any>) => {
  const updateNoteText = useWorkflowStore((s) => s.updateNoteText);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(data.noteText || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const text = draft.trim();
    if (text !== (data.noteText || '')) updateNoteText(id, text);
  };

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      onDoubleClick={() => { setDraft(data.noteText || ''); setEditing(true); }}
      style={{
        width: 210,
        minHeight: 90,
        background: 'linear-gradient(160deg, #2A2213, #231C10)',
        border: `1px solid ${selected ? '#F59E0B' : 'rgba(245, 158, 11, 0.35)'}`,
        borderLeft: '3px solid #F59E0B',
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: selected ? '0 0 16px rgba(245,158,11,0.35)' : '0 2px 10px rgba(0,0,0,0.4)',
        cursor: editing ? 'text' : 'grab',
        position: 'relative',
      }}
      title="Double-click to edit note"
    >
      <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>
        📝 NOTE
      </div>
      {editing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') commit();
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit();
            e.stopPropagation(); // don't trigger canvas shortcuts
          }}
          style={{
            width: '100%', minHeight: 70, resize: 'vertical',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 6, color: '#F4F7FB', fontSize: 12, lineHeight: 1.5,
            padding: 8, outline: 'none', fontFamily: 'inherit',
          }}
        />
      ) : (
        <div style={{ fontSize: 12, color: '#D8C9A8', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {data.noteText || <span style={{ color: '#8A7A55', fontStyle: 'italic' }}>Double-click to write…</span>}
        </div>
      )}

      {/* Annotation handles — notes connect visually but never execute */}
      <Handle type="target" position={Position.Left} id="note-in"
        style={{ background: '#F59E0B', border: 'none', width: 8, height: 8, top: 20 }} />
      <Handle type="source" position={Position.Right} id="note-out"
        style={{ background: '#F59E0B', border: 'none', width: 8, height: 8, top: 20 }} />
    </div>
  );
};

export default React.memo(NoteNode);