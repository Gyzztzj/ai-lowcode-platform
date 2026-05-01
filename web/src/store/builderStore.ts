import { create } from "zustand";
import type { Node, Edge } from "reactflow";

interface BuilderState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  selectedEdge: Edge | null;

  setNodes: (nodesOrUpdater: Node[] | ((prevNodes: Node[]) => Node[])) => void;
  setEdges: (edgesOrUpdater: Edge[] | ((prevEdges: Edge[]) => Edge[])) => void;
  setSelectedNode: (node: Node | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,

  setNodes: (nodesOrUpdater) =>
    set((state) => {
      let newNodes: Node[];
      if (typeof nodesOrUpdater === 'function') {
        newNodes = nodesOrUpdater(state.nodes);
      } else {
        newNodes = Array.isArray(nodesOrUpdater) ? nodesOrUpdater : state.nodes;
      }
      return {
        nodes: newNodes,
        selectedNode: (() => {
          const selected = state.selectedNode;
          return selected && newNodes.some((n) => n.id === selected.id)
            ? selected
            : null;
        })(),
      };
    }),
  setEdges: (edgesOrUpdater) =>
    set((state) => {
      let newEdges: Edge[];
      if (typeof edgesOrUpdater === 'function') {
        newEdges = edgesOrUpdater(state.edges);
      } else {
        newEdges = Array.isArray(edgesOrUpdater) ? edgesOrUpdater : [];
      }
      return { edges: newEdges };
    }),
  setSelectedNode: (node) => set({ selectedNode: node, selectedEdge: null }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedNode: null }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
      ),
      selectedNode:
        state.selectedNode?.id === id
          ? {
              ...state.selectedNode,
              data: { ...state.selectedNode.data, ...data },
            }
          : state.selectedNode,
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      ),
      selectedNode: state.selectedNode?.id === id ? null : state.selectedNode,
    })),

  deleteEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdge: state.selectedEdge?.id === id ? null : state.selectedEdge,
    })),
}));
