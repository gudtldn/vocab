import React, { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useI18n } from "../i18n/I18nContext";

const UpdateChecker: React.FC = () => {
  const { t } = useI18n();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update?.available) {
        setUpdateAvailable(true);
        setUpdateVersion(update.version);
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      setDownloading(true);
      const update = await check();
      
      if (update?.available) {
        await update.downloadAndInstall();
        // 업데이트 설치 완료 후 재시작
        await relaunch();
      }
    } catch (error) {
      console.error("Failed to update:", error);
      setDownloading(false);
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="update-notification">
      <div className="update-content">
        <h3 className="update-title">
          🎉 {t.update.newVersion}: v{updateVersion}
        </h3>
        <p className="update-message">
          {t.update.description}
        </p>
        {downloading ? (
          <div className="update-progress">
            <p className="progress-text">{t.update.install}...</p>
          </div>
        ) : (
          <div className="update-actions">
            <button onClick={handleUpdate} className="button button-primary">
              {t.update.install}
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="button button-secondary"
            >
              {t.update.later}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateChecker;
