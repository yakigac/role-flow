import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "reactflow";

import Settings from "./Settings";
import { fetchGPTLabels } from "/src/utils/openai";
import { getUniqueId } from "/src/utils/uniqueid";
import "./SaveRestore.css";

export const SaveRestore = () => {
  const getInitialNodes = (label) => {
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
  const [rfInstance, setRfInstance] = useState(null);
  const { setViewport } = useReactFlow();
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [userSettings, setUserSettings] = useState({
    apiKey: "",
    firstItem: "",
  });

  const handleSaveSettings = (settings) => {
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
      // 1. フローのデータをオブジェクトに変換
      const flow = rfInstance.toObject();

      // 2. オブジェクトを整形されたJSON文字列に変換（インデントを使用して読みやすくします）
      const flowData = JSON.stringify(flow, null, 2);

      // 3. JSON文字列をBlobオブジェクトに変換（ファイルとして扱うため）
      const blob = new Blob([flowData], { type: "application/json" });

      // 4. Blobオブジェクトからダウンロード用のURLを作成
      const url = URL.createObjectURL(blob);

      // 5. ダウンロードをトリガーするためのアンカータグ（<a>）を作成
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "flow-data.json"; // ダウンロードされるファイルの名前を設定

      // 6. アンカータグをDOMに追加し、クリックイベントを発火させることでダウンロードを開始
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // 7. ダウンロードが完了したら、アンカータグをDOMから削除
      document.body.removeChild(downloadLink);
    }
  }, [rfInstance]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const json = e.target.result;
        const flow = JSON.parse(json);

        if (flow) {
          const { x = 0, y = 0, zoom = 1 } = flow.viewport;
          setNodes(flow.nodes || []);
          setEdges(flow.edges || []);
          setViewport({ x, y, zoom });
        }
      };

      reader.readAsText(file);
    }
  };

  const onRestore = () => {
    document.getElementById("file-input").click();
  };

  const onClear = useCallback(() => {
    const updatedInitialNodes = getInitialNodes(userSettings.firstItem);
    setNodes(updatedInitialNodes);
    setEdges(initialEdges);
  }, [userSettings]);

  const updateNodeLabels = (newNodeIds, labels) => {
    // newNodesとIDが一致するノードのラベルを更新
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((node) => {
        if (newNodeIds.includes(node.id)) {
          const label = labels.shift();
          return { ...node, data: { ...node.data, label } };
        }
        return node;
      });
      return updatedNodes;
    });
  };

  const handleNodeClick = async (e, data) => {
    const nodesWithSameParent = nodes.filter(
      (node) => node?.data?.parentId === data?.id
    );

    let newNodes = [];
    let newNodeIds = [];
    let newEdges = [];

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

    let currentNode = data;
    let parentLabels = [];
    while (currentNode) {
      parentLabels.unshift(currentNode.data.label);
      currentNode = nodes.find((node) => node.id === currentNode.data.parentId);
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
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      <div className="save__controls">
        <button onClick={onExport}>export</button>
        <button onClick={onRestore}>import</button>
        <button onClick={onClear}>clear</button>
        <button onClick={handleOpenSettings}>settings</button>
        <input
          type="file"
          id="file-input"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};
