import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { Configuration, OpenAIApi } from "openai";
import Settings from "./Settings";
import "reactflow/dist/style.css";

import "./index.css";

function getTreeLabels(parentLabels) {
  return parentLabels.join(" > ");
}

async function fetchGPTLabels(apiKey, parentLabels) {
  const configuration = new Configuration({
    apiKey: apiKey, // Update to use userSettings.apiKey
  });
  const openai = new OpenAIApi(configuration);

  console.log("parentLabels", parentLabels);
  const treeLabels = getTreeLabels(parentLabels);
  const prompt = `## あなたの役割：
あなたは与えられた役割に対し、ツリー構造を作るイメージで役割の分割を行います。
目的は、役割をMECEに分担し、単純化することで、その役割を担う人が具体的な作業を行いやすくすることです。

## 過去の作業情報
現時点までの分解状況は以下の通りです。
ただし、あなたに知らされているのは直系に辿れる役割のみです。横の役割は含んでいません。
${treeLabels}

## 業務命令
過去の作業状況を踏まえて、一番最後の役割を出来る限りMECEかつ具体的な役割に分割してください。
分割後の役割は、必ず3つにする必要があります。
出力は下記例のようにカンマ区切りにしてください。

## 出力例
* 分割後の役割1
* 分割後の役割2
* 分割後の役割3

## 開始！
${parentLabels[parentLabels.length - 1]}を分割する場合、以下のように分割します。
* `;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = completion.data.choices[0].message.content;
    console.log("response:", responseText);
    const fetchedLabels = responseText
      .trim()
      .split("*")
      .map((label) => label.trim());

    return fetchedLabels;
  } catch (error) {
    if (error.response) {
      console.error(
        `【error ${error.response.status}】 ${error.response.data.error.message}`
      );
      return ["Error", "Error", "Error"];
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      return ["Error", "Error", "Error"];
    }
  }
}

const flowKey = "example-flow";

const getId = () => uuidv4();

const initialNodes = [
  {
    id: "1",
    data: { label: "大学生のサポート" },
    position: { x: 100, y: 100 },
  },
];
const initialEdges = [];

const SaveRestore = () => {
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
    setSettingsVisible(false);
  };

  const handleOpenSettings = () => {
    setSettingsVisible(true);
  };

  const onConnect = useCallback(
    (params) => setEdges((prevEdges) => addEdge(params, prevEdges)),
    []
  );

  const onSave = useCallback(() => {
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
    setNodes([]);
    setEdges([]);
  }, []);

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
        id: getId(),
        data: { label: `Loading...`, parentId: data.id },
        position: {
          x: data.position.x + (nodesWithSameParent.length + i) * 160,
          y: data.position.y + 100,
        },
      };
      newNodes.push(newNode);
      newNodeIds.push(newNode.id);

      const newEdge = {
        id: getId(),
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

  useEffect(() => {
    if (userSettings.firstItem) {
      const newNode = {
        id: "1",
        data: { label: userSettings.firstItem },
        position: { x: 100, y: 100 },
      };
      setNodes((prevNodes) =>
        prevNodes.map((node) => (node.id === "1" ? newNode : node))
      );
    }
  }, [userSettings.firstItem]);

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
        <button onClick={onSave}>save</button>
        <button onClick={onRestore}>load</button>
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

export default () => (
  <ReactFlowProvider>
    <SaveRestore />
  </ReactFlowProvider>
);
