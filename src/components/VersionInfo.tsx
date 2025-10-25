import React from "react";

const VersionInfo: React.FC = () => {
  const version = import.meta.env.VITE_APP_VERSION;

  return (
    <div className="version-info">
      <span className="version-text">v{version}</span>
    </div>
  );
};

export default VersionInfo;
