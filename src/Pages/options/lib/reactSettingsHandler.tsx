import { useEffect, useState } from 'react';
import { loadSettings, saveSettings, defaultSettings } from '../../../contentScripts/lib/SettingsHandler';
import { Id as ToastId, ToastOptions, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const useShareableState = () => {
  const toastConfig: ToastOptions<{}> = {
    position: 'bottom-right',
    autoClose: 3_000,
  };

  const [sharedSettings, setSharedSettings] = useState(defaultSettings);
  const [lastSavedDateSuccess, setLastSavedDateSuccess] = useState(new Date());
  const [lastSavedIdSuccess, setLastSavedIdSuccess] = useState<ToastId | null>(null);
  const [lastSavedDateWarn, setLastSavedDateWarn] = useState(new Date());
  const [lastSavedIdWarn, setLastSavedIdWarn] = useState<ToastId | null>(null);
  const [lastSavedDateError, setLastSavedDateError] = useState(new Date());
  const [lastSavedIdError, setLastSavedIdError] = useState<ToastId | null>(null);

  useEffect(() => {
    loadSettings()
      .then((settings) => {
        setSharedSettings(settings);
      })
      .catch((error) => {
        console.warn(error);
      });
  }, []);

  useEffect(() => {
    saveSharedSettings();
  }, [sharedSettings]);

  const updateSharedSettings = (newSettings: any) => {
    setSharedSettings({ ...sharedSettings, ...newSettings });
  };

  const saveSharedSettings = async () => {
    let now = new Date();

    if (sharedSettings.indicateAllDayEvents_minTransparency > sharedSettings.indicateAllDayEvents_maxTransparency) {
      if (now.getTime() - lastSavedDateError.getTime() > 2900) {
        setLastSavedIdError(
          toast.error('The minimum transparency cannot be higher than the maximum transparency.', {
            position: 'bottom-right',
            autoClose: 3_000,
          }),
        );
      } else {
        toast.update(lastSavedIdError!, {
          position: 'bottom-right',
          autoClose: 3_000,
          render: 'The minimum transparency cannot be higher than the maximum transparency.',
        });
      }
      setLastSavedDateError(now);
      return;
    }

    let wasSaved = saveSettings(sharedSettings);


    if (await wasSaved) {
      if (now.getTime() - lastSavedDateSuccess.getTime() > 2900) {
        setLastSavedIdSuccess(toast.success('Saved successfully', toastConfig));
      } else {
        toast.update(lastSavedIdSuccess!, {
          ...toastConfig,
          render: 'Saved successfully',
        });
      }
      setLastSavedDateSuccess(now);
    } else {
      if (now.getTime() - lastSavedDateWarn.getTime() > 14900) {
        setLastSavedIdWarn(toast.warn('Error while saving!', toastConfig));
      } else {
        toast.update(lastSavedIdWarn!, {
          ...toastConfig,
          render: 'Error while saving!',
        });
      }
      setLastSavedDateWarn(now);
    }
  };

  const loadSharedSettings = () => {
    loadSettings().then((loadedSettings) => {
      setSharedSettings(loadedSettings);
    });
  };

  const restoreDefaultSharedSettings = () => {
    console.log('restoreDefaultSharedSettings');
    setSharedSettings(defaultSettings);
    saveSettings(defaultSettings);
    
    setLastSavedIdSuccess(toast.success('Restored Default', toastConfig));
  };

  return {
    sharedSettings,
    setSharedSettings,
    updateSharedSettings,
    saveSharedSettings,
    loadSharedSettings,
    restoreDefaultSharedSettings,
  };
};
