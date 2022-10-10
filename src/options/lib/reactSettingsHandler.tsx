import { useEffect, useState } from 'react';
import { settings, loadSettings, saveSettings, defaultSettings } from '../../contentScripts/lib/SettingsHandler';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const useShareableState = () => {
  const [sharedSettings, setSharedSettings] = useState(settings);

  const updateSharedSettings = (newSettings: any) => {
    setSharedSettings({ ...sharedSettings, ...newSettings });
  };

  const saveSharedSettings = async () => {
    let wasSaved = saveSettings(sharedSettings);
    console.info('saveSharedSettings', wasSaved);
    if (await wasSaved) {
      toast.success('Saved successfully', {
        position: 'bottom-right',
        autoClose: 3_000
      });
    } else {
      toast.warn('Error while saving!', {
        position: 'bottom-right',
        autoClose: 15_000
      });
    }
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
    // send chrome message
    //chrome.runtime.sendMessage("isDarkmode: "+window.matchMedia('(prefers-color-scheme: dark)').matches);
    loadSettings()
      .then((settings) => {
        setSharedSettings(settings);
      })
      .catch((error) => {
        console.warn(error);
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
