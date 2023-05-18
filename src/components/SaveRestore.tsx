import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowInstance,
  Node,
  Edge,
  BackgroundVariant,
  NodeProps,
} from "reactflow";
import Settings from "./Settings";
import MyControls from "./MyControls";
import { fetchGPTLabels } from "../utils/openai";
import { getUniqueId } from "../utils/uniqueid";
import "./SaveRestore.css";
import EditableNode from "./EditableNode";
interface UserSettings {
  apiKey: string;
  firstItem: string;
}

export const SaveRestore: React.FC = () => {
  const getInitialNodes = (label?: string): Node[] => {
    return [
      {
        id: "1",
        data: { label: label ? label : "大学生をアシスタントするAI" },
        position: { x: 100, y: 100 },
        type: "input",
      },
    ];
  };
  const initialNodes = getInitialNodes();
  const initialEdges = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance>();
  const { setViewport } = useReactFlow();
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    apiKey: "",
    firstItem: "",
  });

  const updateNodeData = (nodeId: string, newLabel: string) => {
    setNodes((prevNodes: Node[]) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  };

  const nodeTypes = useMemo(
    () => ({
      default: (props: NodeProps) => (
        <EditableNode {...props} updateNodeData={updateNodeData} />
      ),
      input: (
        props: NodeProps // ← Add this line
      ) => <EditableNode {...props} updateNodeData={updateNodeData} />,
    }),
    []
  );

  const handleSaveSettings = (settings: UserSettings) => {
    setUserSettings(settings);
    const updatedInitialNodes = getInitialNodes(settings.firstItem);
    setNodes(updatedInitialNodes);
    setSettingsVisible(false);
  };

  const handleOpenSettings = () => {
    setSettingsVisible(true);
  };

  const onConnect = useCallback(
    (params) => setEdges((prevEdges) => addEdge(params, prevEdges)),
    []
  );

  const onExport = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const flowData = JSON.stringify(flow, null, 2);
      const blob = new Blob([flowData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "flow-data.json";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }, [rfInstance]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const json = e.target?.result;

        if (json) {
          const flow = JSON.parse(json as string);

          if (flow) {
            const { x = 0, y = 0, zoom = 1 } = flow.viewport;
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
            setViewport({ x, y, zoom });
          }
        }
      };

      reader.readAsText(file);
    }
  };

  const onRestore = () => {
    const fileInputElement = document.getElementById("file-input");
    if (fileInputElement) {
      fileInputElement.click();
    }
  };

  const onClear = useCallback(() => {
    const updatedInitialNodes = getInitialNodes(userSettings.firstItem);
    setNodes(updatedInitialNodes);
    setEdges(initialEdges);
  }, [userSettings]);

  const updateNodeLabels = (newNodeIds: string[], labels: string[]) => {
    setNodes((prevNodes: Node[]) => {
      const updatedNodes = prevNodes.map((node) => {
        if (newNodeIds.includes(node.id)) {
          const label = labels.shift();
          if (label) {
            return { ...node, data: { ...node.data, label } };
          }
        }
        return node;
      });
      return updatedNodes;
    });
  };

  const handleNodeClick = async (e: React.MouseEvent, data: Node) => {
    const nodesWithSameParent = nodes.filter(
      (node) => node?.data?.parentId === data?.id
    );

    const newNodes: Node[] = [];
    const newNodeIds: string[] = [];
    const newEdges: Edge[] = [];

    for (let i = 0; i < 3; i++) {
      const newNode = {
        id: getUniqueId(),
        data: { label: `Loading...`, parentId: data.id },
        position: {
          x: data.position.x + (nodesWithSameParent.length + i - 1) * 160,
          y: data.position.y + 100,
        },
      };
      newNodes.push(newNode);
      newNodeIds.push(newNode.id);

      const newEdge = {
        id: getUniqueId(),
        source: data.id,
        target: newNode.id,
      };
      newEdges.push(newEdge);
    }

    setNodes((prevNodes) => [...prevNodes, ...newNodes]);
    setEdges((prevEdges) => [...prevEdges, ...newEdges]);

    let currentNode: Node | undefined = data;
    const parentLabels: string[] = [];
    while (currentNode) {
      parentLabels.unshift(currentNode.data.label);
      const parentId = currentNode.data.parentId;
      currentNode = parentId
        ? nodes.find((node) => node.id === parentId)
        : undefined;
    }
    const fetchedLabels = await fetchGPTLabels(
      userSettings.apiKey,
      parentLabels
    );
    updateNodeLabels(newNodeIds, fetchedLabels);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {settingsVisible && (
        <Settings
          onSave={handleSaveSettings}
          onClose={() => setSettingsVisible(false)}
          propApiKey={userSettings.apiKey}
          propFirstItem={userSettings.firstItem}
        />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      <MyControls
        onExport={onExport}
        onRestore={onRestore}
        onClear={onClear}
        handleOpenSettings={handleOpenSettings}
        handleFileUpload={handleFileUpload}
      />
    </div>
  );
};
