// client/src/modules/workspace/components/AiProposalModal.tsx
// Preview modal for AI-generated workflows. The AI NEVER mutates the canvas
// directly — the user reviews the proposal and clicks Apply.
import { useWorkflowStore, AiWorkflowProposal } from '../store/workflowStore';
import { nodeRegistry } from '../config/nodeRegistry';
import { layoutNodesByDepth, getNotePosition } from '../utils/nodeLayout';
import { Sparkles, X, Check, AlertTriangle } from 'lucide-react';

export default function AiProposalModal() {
  const aiProposal = useWorkflowStore((s) => s.aiProposal);
  const clearAiProposal = useWorkflowStore((s) => s.clearAiProposal);
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);

  if (!aiProposal) return null;

  const apply = () => {
    // Map server plan → real canvas nodes
    const idByIndex = new Map<number, string>();
    const built: any[] = [];

    aiProposal.nodes.forEach((spec, i) => {
      const def = nodeRegistry[spec.key];
      if (!def) return;
      const id = crypto.randomUUID();
      idByIndex.set(i, id);
      const parameters = def.parameters.map((p) => ({
        ...p,
        default: spec.params?.[p.name] !== undefined ? spec.params[p.name] : p.default,
      }));
      built.push({
        id,
        type: def.category === 'Documentation' ? 'noteNode' : 'mlNode',
        position: { x: 0, y: 0 },
        data: { ...def, status: 'idle', parameters, noteText: spec.note },
      });
    });

    const edges = aiProposal.edges
      .map(([from, to]) => {
        const source = idByIndex.get(from);
        const target = idByIndex.get(to);
        return source && target ? { id: `e-${source}-${target}`, source, target, animated: true } : null;
      })
      .filter(Boolean);

    // Layered layout for the main pipeline
    const execNodes = built.filter((n) => n.type === 'mlNode');
    const laidOut = layoutNodesByDepth(execNodes, edges as any[]);
    const byId = new Map(laidOut.map((n) => [n.id, n]));

    // Notes positioned near their attach targets
    aiProposal.notes.forEach((noteSpec) => {
      const targetId = idByIndex.get(noteSpec.attach);
      const targetNode = targetId ? byId.get(targetId) : undefined;
      const def = nodeRegistry['note'];
      if (!def) return;
      built.push({
        id: crypto.randomUUID(),
        type: 'noteNode',
        position: targetNode ? getNotePosition(targetNode) : getNextSafe(),
        data: { ...def, status: 'idle', parameters: [], noteText: noteSpec.text },
      });
    });

    function getNextSafe() { return { x: 80, y: 140 + built.length * 40 }; }

    const finalNodes = built.map((n) => (byId.has(n.id) ? byId.get(n.id)! : n));
    loadTemplate(finalNodes, edges as any[]);
    clearAiProposal();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1500,
      background: 'rgba(5,11,24,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 520, maxHeight: '80vh', overflowY: 'auto',
        background: '#0A1426', border: '1px solid #18253A', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Sparkles size={18} color="#8B5CF6" />
          <div style={{ fontWeight: 700, fontSize: 16, color: '#F4F7FB', flex: 1 }}>AI-Designed Workflow</div>
          <button onClick={clearAiProposal} style={{ background: 'none', border: 'none', color: '#65758C', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#9AA9BF', marginBottom: 16, lineHeight: 1.5 }}>{aiProposal.summary}</div>

        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65758C', fontWeight: 600, marginBottom: 8 }}>
          Proposed pipeline ({aiProposal.nodes.length} nodes)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: aiProposal.notes.length ? 16 : 20 }}>
          {aiProposal.nodes.map((spec, i) => {
            const def = nodeRegistry[spec.key];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#050B18', border: '1px solid #18253A', borderRadius: 8, padding: '10px 12px',
              }}>
                <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{def?.icon ?? '❓'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F4F7FB' }}>{def?.title ?? spec.key}</div>
                  {spec.reason && <div style={{ fontSize: 11, color: '#65758C', whiteSpace: 'normal' }}>{spec.reason}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {aiProposal.notes.length > 0 && (
          <>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#65758C', fontWeight: 600, marginBottom: 8 }}>
              With {aiProposal.notes.length} documentation note{aiProposal.notes.length > 1 ? 's' : ''}
            </div>
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aiProposal.notes.map((n, i) => (
                <div key={i} style={{
                  fontSize: 11, color: '#D8C9A8', background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: 10, lineHeight: 1.5,
                }}>
                  📝 {n.text.substring(0, 160)}{n.text.length > 160 ? '…' : ''}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={apply} style={{
            flex: 1, background: '#22C55E', color: '#050B18', border: 'none', borderRadius: 8,
            padding: '11px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Check size={15} /> Apply Workflow
          </button>
          <button onClick={clearAiProposal} style={{
            background: 'none', border: '1px solid #18253A', color: '#9AA9BF', borderRadius: 8,
            padding: '11px 16px', fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#65758C' }}>
          <AlertTriangle size={12} /> Applying replaces the current canvas — your previous workflow stays saved in the dashboard.
        </div>
      </div>
    </div>
  );
}