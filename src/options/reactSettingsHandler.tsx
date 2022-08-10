import { useEffect, useState } from 'react';
import { settings, loadSettings, saveSettings, defaultSettings } from '../contentScripts/lib/SettingsHandler';

export const useShareableState = () => {
  const [sharedSettings, setSharedSettings] = useState(settings);

  const updateSharedSettings = (newSettings: any) => {
    setSharedSettings({ ...sharedSettings, ...newSettings });
  };

  const saveSharedSettings = () => {
    console.log('saveSharedSettings', sharedSettings);
    saveSettings(sharedSettings);
  };

  const loadSharedSettings = () => {
    loadSettings();
    setSharedSettings(settings);
  };

  const restoreDefaultSharedSettings = () => {
    setSharedSettings(defaultSettings);
    saveSettings(defaultSettings);
  };

  useEffect(() => {
    loadSettings()
      .then((settings) => {
        setSharedSettings(settings);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return {
    sharedSettings,
    setSharedSettings,
    updateSharedSettings,
    saveSharedSettings,
    loadSharedSettings,
    restoreDefaultSharedSettings,
  };
};
