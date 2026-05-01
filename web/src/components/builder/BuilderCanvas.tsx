import { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import "reactflow/dist/style.css";
import { useBuilderStore } from "@/store/builderStore";
import { nodeTypes } from "./nodes";
import { useKeyPress } from "@/hooks/useKeyPress";
import { useAppStore } from "@/store/appStore";
import NodeContextMenu from "./NodeContextMenu";
import NodePropertiesDialog from "./NodePropertiesDialog";
import { EdgeContextMenu } from "./EdgeContextMenu";

const BuilderCanvas = () => {
  const currentApp = useAppStore((state) => state.currentApp);
  const nodes = useBuilderStore((state) => state.nodes);
  const edges = useBuilderStore((state) => state.edges);
  const selectedNode = useBuilderStore((state) => state.selectedNode);
  const selectedEdge = useBuilderStore((state) => state.selectedEdge);
  const setNodes = useBuilderStore((state) => state.setNodes);
  const setEdges = useBuilderStore((state) => state.setEdges);
  const setSelectedNode = useBuilderStore((state) => state.setSelectedNode);
  const setSelectedEdge = useBuilderStore((state) => state.setSelectedEdge);
  const deleteNode = useBuilderStore((state) => state.deleteNode);
  const deleteEdge = useBuilderStore((state) => state.deleteEdge);

  const [nodeContextMenu, setNodeContextMenu] = useState<{
    node: Node | null;
    position: { x: number; y: number };
  } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);

  const edgeReconnectSuccessful = useRef(true);

  const closeContextMenus = useCallback(() => {
    setNodeContextMenu(null);
    setEdgeContextMenu(null);
  }, []);

  const openPropertiesDialog = useCallback(() => {
    closeContextMenus();
    setPropertiesDialogOpen(true);
  }, [closeContextMenus]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [setEdges],
  );

  const onReconnectEnd = useCallback(
    (_: any, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        deleteEdge(edge.id);
      }
      edgeReconnectSuccessful.current = true;
    },
    [deleteEdge],
  );

  // 按Delete键删除选中节点或边
  useKeyPress("Delete", () => {
    if (selectedEdge) {
      useBuilderStore.getState().deleteEdge(selectedEdge.id);
    } else if (
      selectedNode &&
      selectedNode.type !== "start" &&
      selectedNode.type !== "end"
    ) {
      deleteNode(selectedNode.id);
    }
  });

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
    },
    [setEdges, edges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      closeContextMenus();
    },
    [setSelectedNode, closeContextMenus],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setSelectedNode(node);
      setNodeContextMenu({
        node,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [setSelectedNode],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      deleteEdge(edge.id);
      closeContextMenus();
    },
    [deleteEdge, closeContextMenus],
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setSelectedEdge(edge);
      setEdgeContextMenu({
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [setSelectedEdge],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    closeContextMenus();
  }, [setSelectedNode, setSelectedEdge, closeContextMenus]);

  // 加载应用流程数据
  useEffect(() => {
    const isArray = (value: any) => Array.isArray(value);

    if (currentApp) {
      const validNodes = isArray(currentApp.nodes)
        ? (currentApp.nodes as Node[])
        : null;
      const validEdges = isArray(currentApp.edges)
        ? (currentApp.edges as Edge[])
        : null;

      if (validNodes && validEdges) {
        setNodes(validNodes);
        setEdges(validEdges);
      } else {
        // 为旧应用或数据损坏的应用生成默认流程
        const defaultNodes: Node[] = [
          {
            id: "start",
            type: "start",
            position: { x: 100, y: 200 },
            data: {},
          },
          {
            id: "system-prompt",
            type: "systemPrompt",
            position: { x: 350, y: 200 },
            data: { content: currentApp.systemPrompt },
          },
          {
            id: "llm",
            type: "llm",
            position: { x: 600, y: 200 },
            data: { model: currentApp.defaultModel },
          },
          {
            id: "end",
            type: "end",
            position: { x: 850, y: 200 },
            data: {},
          },
        ];

        const defaultEdges: Edge[] = [
          { id: "e1", source: "start", target: "system-prompt" },
          { id: "e2", source: "system-prompt", target: "llm" },
          { id: "e3", source: "llm", target: "end" },
        ];

        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
    }
  }, [currentApp, setNodes, setEdges]);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const nodeDataStr = event.dataTransfer.getData("application/reactflow");

    if (!nodeDataStr) return;

    try {
      const nodeData = JSON.parse(nodeDataStr);
      // 获取画布位置
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left - 90;
      const y = event.clientY - rect.top - 30;

      const newNodeData: Record<string, unknown> = {
        label: nodeData.label,
        color: nodeData.color,
      };
      
      // 为变量设置节点添加初始的空变量数组
      if (nodeData.type === 'variableSet') {
        newNodeData.variables = [];
      }

      // 为条件分支节点初始化空的分支数组
      if (nodeData.type === 'condition') {
        newNodeData.branches = [];
      }

      // 为 LLM 节点初始化默认值
      if (nodeData.type === 'llm') {
        if (currentApp?.defaultModel) {
          newNodeData.model = currentApp.defaultModel;
        }
        newNodeData.temperature = 0.7;
      }

      const newNode = {
        id: uuidv4(),
        type: nodeData.type,
        position: { x, y },
        data: newNodeData,
      };

      setNodes([...nodes, newNode]);
    } catch (e) {
      console.error("Failed to parse node data", e);
    }
  };

  return (
    <div
      className="flex-1 bg-gray-50 relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        panOnDrag
        zoomOnScroll
        nodesDraggable
        nodesConnectable
        elementsSelectable
        edgesUpdatable
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#6366f1" },
        }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {nodeContextMenu && (
        <NodeContextMenu
          node={nodeContextMenu.node}
          position={nodeContextMenu.position}
          onClose={closeContextMenus}
          onEditProperties={openPropertiesDialog}
        />
      )}

      {edgeContextMenu && (
        <EdgeContextMenu
          position={edgeContextMenu.position}
          onClose={closeContextMenus}
        />
      )}

      <NodePropertiesDialog
        open={propertiesDialogOpen}
        onOpenChange={() => setPropertiesDialogOpen(false)}
      />
    </div>
  );
};

export default BuilderCanvas;
