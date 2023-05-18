// EditableNode.tsx

import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";

interface EditableNodeProps extends NodeProps {
  data: { label: string; parentId?: string };
  updateNodeData: (nodeId: string, newLabel: string) => void;
}

const EditableNode: React.FC<EditableNodeProps> = (props) => {
  const { data, id, updateNodeData } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevents the event from bubbling up
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeData(id, label); // Update the node data using the callback function
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // これはフォームのデフォルトの送信動作を防ぎます。
    setIsEditing(false);
    updateNodeData(id, label); // Update the node data using the callback function
  };

  return (
    <div>
      {isEditing ? (
        <>
          <form onSubmit={handleSubmit}>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
            />
          </form>
          <Handle type="source" position={Position.Bottom} />
          <Handle type="target" position={Position.Top} />
        </>
      ) : (
        <>
          <div>{data.label}</div>
          <button onClick={handleEditClick}>Edit</button>
          <Handle type="source" position={Position.Bottom} />
          <Handle type="target" position={Position.Top} />
        </>
      )}
    </div>
  );
};

export default EditableNode;
