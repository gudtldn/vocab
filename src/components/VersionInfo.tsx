import React from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

const VersionInfo: React.FC = () => {
  const version = import.meta.env.VITE_APP_VERSION;

  const handleClick = async () => {
    try {
      await openUrl(`https://github.com/gudtldn/vocab/releases/tag/v${version}`);
    } catch (error) {
      console.error("Failed to open release page:", error);
    }
  };

  return (
    <div className="version-info">
      <span 
        className="version-text" 
        onClick={handleClick}
        title={`View release v${version}`}
      >
        v{version}
      </span>
    </div>
  );
};

export default VersionInfo;
