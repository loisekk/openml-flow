import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { MLNodeData } from '../config/nodeRegistry';

interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  activeNodeStudioId: string | null; 
  isNodePanelOpen: boolean;
  activeTab: 'editor' | 'executions' | 'evaluations';
  isExecuting: boolean;
  executionLogs: string[];
  executionData: any | null; 
  executionMetrics: any | null;
  customWorkflowCode: string | null;
  workflowName: string; 
  
  // Phase 10: History
  past: GraphSnapshot[];
  future: GraphSnapshot[];
  
  // Dockable Panel UI State
  bottomPanelHeight: number;
  bottomPanelCollapsed: boolean;
  inspectorWidth: number;
  inspectorCollapsed: boolean;
  aiAssistantOpen: boolean;
  aiAssistantWidth: number;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (nodeData: MLNodeData, position: { x: number; y: number }) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveNodeStudio: (id: string | null) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  updateNodeParameters: (nodeId: string, paramName: string, value: any) => void;
  updateNodeCode: (nodeId: string, code: string) => void;
  toggleNodePanel: (isOpen?: boolean) => void;
  setTab: (tab: 'editor' | 'executions' | 'evaluations') => void;
  setExecuting: (isExecuting: boolean) => void;
  addExecutionLog: (log: string) => void;
  clearLogs: () => void;
  setExecutionData: (data: any) => void; 
  setExecutionMetrics: (metrics: any) => void;
  setCustomWorkflowCode: (code: string | null) => void;
  setWorkflowName: (name: string) => void; 
  updateNodeStatus: (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => void; // <-- ADDED
  
  // Phase 10: Actions
  snapshot: () => void;
  undo: () => void;
  redo: () => void;
  loadTemplate: (nodes: Node[], edges: Edge[]) => void;
  setGraph: (nodes: Node[], edges: Edge[]) => void;

  // Panel Actions
  setBottomPanelHeight: (h: number) => void;
  toggleBottomPanel: () => void;
  setInspectorWidth: (w: number) => void;
  toggleInspector: () => void;
  toggleAIAssistant: () => void;
  setAIAssistantWidth: (w: number) => void;
  resetLayout: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  activeNodeStudioId: null,
  isNodePanelOpen: false,
  activeTab: 'editor',
  isExecuting: false,
  executionLogs: [],
  executionData: null,
  executionMetrics: null,
  customWorkflowCode: null,
  workflowName: 'Untitled Workflow', 
  past: [],
  future: [],

  bottomPanelHeight: 280,
  bottomPanelCollapsed: false,
  inspectorWidth: 340,
  inspectorCollapsed: false,
  aiAssistantOpen: false,
  aiAssistantWidth: 400,

  snapshot: () => {
    set((state) => ({
      past: [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-50),
      future: []
    }));
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        past: state.past.slice(0, -1),
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        nodes: next.nodes,
        edges: next.edges,
        past: [...state.past, { nodes: state.nodes, edges: state.edges }],
        future: state.future.slice(1),
      };
    });
  },

  loadTemplate: (nodes, edges) => {
    get().snapshot();
    set({ nodes, edges, selectedNodeId: null, customWorkflowCode: null });
  },

  setGraph: (nodes, edges) => {
    set({ nodes, edges, past: [], future: [], customWorkflowCode: null }); 
  },

  onNodesChange: (changes) => {
    if (changes.some(c => c.type === 'remove')) get().snapshot();
    
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      edges: changes.some(c => c.type === 'remove') 
        ? get().edges.filter(e => !changes.filter(c => c.type === 'remove').map(c => c.id).includes(e.source) && !changes.filter(c => c.type === 'remove').map(c => c.id).includes(e.target))
        : get().edges
    });
  },
  onEdgesChange: (changes) => {
    if (changes.some(c => c.type === 'remove')) get().snapshot();
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    get().snapshot();
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) });
  },
  
  addNode: (nodeData, position) => {
    get().snapshot();
    const newNode = { id: crypto.randomUUID(), type: 'mlNode', position, data: nodeData };
    set({ nodes: [...get().nodes, newNode] });
  },
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setActiveNodeStudio: (id) => set({ activeNodeStudioId: id }),
  deleteNode: (nodeId) => {
    get().snapshot();
    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId
    });
  },
  duplicateNode: (nodeId) => {
    get().snapshot();
    const original = get().nodes.find(n => n.id === nodeId);
    if (!original) return;
    const newNode = { ...original, id: crypto.randomUUID(), position: { x: original.position.x + 40, y: original.position.y + 40 }, selected: true, data: { ...original.data } };
    set({ nodes: [...get().nodes.map(n => ({ ...n, selected: false })), newNode], selectedNodeId: newNode.id });
  },
  updateNodeParameters: (nodeId, paramName, value) => {
    set({
      nodes: get().nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, parameters: node.data.parameters.map((p: any) => p.name === paramName ? { ...p, default: value } : p) } } : node),
    });
  },
  updateNodeCode: (nodeId, code) => {
    set({
      nodes: get().nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, customCode: code } } : node),
    });
  },
  toggleNodePanel: (isOpen) => set({ isNodePanelOpen: isOpen === undefined ? !get().isNodePanelOpen : isOpen }),
  setTab: (tab) => set({ activeTab: tab }),

  setExecuting: (isExecuting) => set({ isExecuting }),
  addExecutionLog: (log) => set({ executionLogs: [...get().executionLogs, log] }),
  clearLogs: () => set({ executionLogs: [] }),
  setExecutionData: (data) => set({ executionData: data }),
  setExecutionMetrics: (metrics) => set({ executionMetrics: metrics }),
  setCustomWorkflowCode: (code) => set({ customWorkflowCode: code }),
  setWorkflowName: (name) => set({ workflowName: name }), 
  
  // <-- ADDED IMPLEMENTATION -->
  updateNodeStatus: (nodeId, status) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, status } } : node
      ),
    });
  },

  setBottomPanelHeight: (h) => set({ bottomPanelHeight: Math.max(160, Math.min(h, window.innerHeight * 0.75)) }),
  toggleBottomPanel: () => set(s => ({ bottomPanelCollapsed: !s.bottomPanelCollapsed })),
  setInspectorWidth: (w) => set({ inspectorWidth: Math.max(280, Math.min(w, 600)) }),
  toggleInspector: () => set(s => ({ inspectorCollapsed: !s.inspectorCollapsed })),
  toggleAIAssistant: () => set(s => ({ aiAssistantOpen: !s.aiAssistantOpen })),
  setAIAssistantWidth: (w) => set({ aiAssistantWidth: Math.max(320, Math.min(w, 550)) }),
  resetLayout: () => set({ 
    bottomPanelHeight: 280, 
    bottomPanelCollapsed: false, 
    inspectorWidth: 340, 
    inspectorCollapsed: false, 
    aiAssistantOpen: false, 
    aiAssistantWidth: 400 
  }),
}));