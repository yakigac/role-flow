import React, { useState, FC } from "react";
import "./Settings.css";

interface SettingsProps {
  onSave: (settings: { apiKey: string }) => void;
  onClose: () => void;
  propApiKey: string;
}

const Settings: FC<SettingsProps> = ({ onSave, onClose, propApiKey }) => {
  const [apiKey, setApiKey] = useState(propApiKey);

  const handleSave = () => {
    onSave({ apiKey });
  };

  return (
    <div className="settings-modal">
      <div className="settings-content">
        <h3>Settings</h3>
        <label>
          <a
            target="_blank"
            rel="noopener noreferrer"
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
        <div className="buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
