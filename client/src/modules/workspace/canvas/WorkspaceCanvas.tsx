// client/src/modules/workspace/canvas/WorkspaceCanvas.tsx
import ReactFlow, { Background, Controls, MiniMap, Node, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import WorkflowNode from './nodes/WorkflowNode';
import NoteNode from './nodes/NoteNode';
import { useWorkflowStore } from '../store/workflowStore';
import { useEffect, useState, useRef } from 'react';
import { MLNodeData } from '../config/nodeRegistry';

const nodeTypes = { mlNode: WorkflowNode, noteNode: NoteNode };

const Canvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId, setActiveNodeStudio } = useWorkflowStore();
  const { fitView, setCenter, getZoom } = useReactFlow();
  const [isMoving, setIsMoving] = useState(false);
  const isExecuting = useWorkflowStore((s) => s.isExecuting);

  // Camera-follow: during execution, smoothly center the currently running
  // node so a 30–50 node workflow is trackable without manual scrolling.
  const lastFollowedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isExecuting) {
      lastFollowedRef.current = null;
      return;
    }
    const running = nodes.find((n) => (n.data as MLNodeData)?.status === 'running');
    if (running && lastFollowedRef.current !== running.id) {
      lastFollowedRef.current = running.id;
      setCenter(running.position.x + 110, running.position.y + 55, {
        zoom: Math.max(getZoom(), 0.85),
        duration: 700,
      });
    }
  }, [nodes, isExecuting, setCenter, getZoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent React Flow from hijacking keys if the user is typing in Monaco or inputs
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' ||
                        activeElement?.tagName === 'TEXTAREA' ||
                        activeElement?.closest('.monaco-editor');

      if (e.key === 'f' && !isTyping) {
        e.preventDefault();
        fitView({ padding: 0.25, duration: 300 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView]);

  return (
    <div style={{ height: '100%', width: '100%', backgroundColor: '#050B18' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={(_, node) => setActiveNodeStudio(node.id)}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        onNodeDragStart={() => setIsMoving(true)}
        onNodeDragStop={() => setIsMoving(false)}
        nodeTypes={nodeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        panActivationKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.5}
        panOnScroll={true}
        zoomOnScroll={false}
        selectionOnDrag={true}
        connectionRadius={30}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#415675', strokeWidth: 2 },
        }}
      >
        <Background color="#17243A" gap={18} size={1} />

        {isMoving && (
          <MiniMap
            nodeColor={(node: Node) => (node.data as MLNodeData)?.color || '#444'}
            maskColor="rgba(5, 11, 24, 0.8)"
            style={{ backgroundColor: '#07101F', border: '1px solid #18253A', borderRadius: '8px' }}
          />
        )}

        <Controls className="rf-controls-dark" showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default function WorkspaceCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}