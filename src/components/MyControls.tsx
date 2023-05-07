import React from "react";

interface ControlsProps {
  onExport: () => void;
  onRestore: () => void;
  onClear: () => void;
  handleOpenSettings: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MyControls: React.FC<ControlsProps> = ({
  onExport,
  onRestore,
  onClear,
  handleOpenSettings,
  handleFileUpload,
}) => {
  return (
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
  );
};

export default MyControls;
