import React, { useEffect, useState } from 'react';
import { BtnGCToolsModalOpen } from './btnModalOpen';
import { BtnGCToolsReport } from './btnGCToolsReport';
import { loadSettings } from '../lib/SettingsHandler';
import { Settings } from '../../interfaces/SettingsInterface';

export const TopBarControls = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync' && changes.settings) {
        setSettings(changes.settings.newValue as Settings);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  if (!settings) return null;

  const showReportButton = settings.isLoggingEnabled && settings.isReportGenerationEnabled;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <BtnGCToolsModalOpen />
      {showReportButton && <BtnGCToolsReport />}
    </div>
  );
};
