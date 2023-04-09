import React, { useState } from "react";
import "./Settings.css";

const Settings = ({ onSave, onClose, propApiKey, propFirstItem }) => {
  const [apiKey, setApiKey] = useState(propApiKey);
  const [firstItem, setFirstItem] = useState(propFirstItem);

  const handleSave = () => {
    onSave({ apiKey, firstItem });
  };

  return (
    <div className="settings-modal">
      <div className="settings-content">
        <h3>Settings</h3>
        <label>
          <a
            target="_blank"
            href="https://platform.openai.com/account/api-keys"
          >
            OPENAI API KEY:
          </a>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <label>
          分解したい役割（例：大学生のサポート）:
          <input
            type="text"
            value={firstItem}
            onChange={(e) => setFirstItem(e.target.value)}
          />
        </label>
        <div className="buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
