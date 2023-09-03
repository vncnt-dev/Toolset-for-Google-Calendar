import { useEffect, useState } from 'react';
import { settings, loadSettings, saveSettings, defaultSettings } from '../../../contentScripts/lib/SettingsHandler';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const useShareableState = () => {
  const [sharedSettings, setSharedSettings] = useState(settings);

  const updateSharedSettings = (newSettings: any) => {
    setSharedSettings({ ...sharedSettings, ...newSettings });
  };

  const saveSharedSettings = async () => {
    if (sharedSettings.indicateFullDayEvents_minTransparency > sharedSettings.indicateFullDayEvents_maxTransparency) {
      toast.error('The minimum transparency cannot be higher than the maximum transparency.', {
        position: 'bottom-right',
        autoClose: 3_000,
      });
      return;
    }

    let wasSaved = saveSettings(sharedSettings);
    if (await wasSaved) {
      toast.success('Saved successfully', {
        position: 'bottom-right',
        autoClose: 3_000,
      });
    } else {
      toast.warn('Error while saving!', {
        position: 'bottom-right',
        autoClose: 15_000,
      });
    }
  };

  const loadSharedSettings = () => {
    loadSettings().then((loadedSettings) => {
      setSharedSettings(loadedSettings);
    });
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
