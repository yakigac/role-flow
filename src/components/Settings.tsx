import React, { useState } from "react";
import PropTypes from "prop-types";
import "./Settings.css";

const Settings = ({ onSave, onClose, propApiKey }) => {
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

Settings.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  propApiKey: PropTypes.string.isRequired,
};

export default Settings;
