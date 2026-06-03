import React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { loadSettings, saveSettings, defaultSettings } from '../../../contentScripts/lib/SettingsHandler';
import { Id as ToastId, ToastOptions, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logging } from '../../../contentScripts/lib/logger';
import type { ReactNode } from 'react';

type ShareableStateValue = ReturnType<typeof useShareableState>;

const ShareableStateContext = createContext<ShareableStateValue | null>(null);

export const ShareableStateProvider = ({ children }: { children: ReactNode }) => {
  const shareableState = useShareableState();

  return <ShareableStateContext.Provider value={shareableState}>{children}</ShareableStateContext.Provider>;
};

export const useShareableStateContext = () => {
  const shareableState = useContext(ShareableStateContext);

  if (!shareableState) {
    throw new Error('useShareableStateContext must be used within a ShareableStateProvider');
  }

  return shareableState;
};

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
  const hasLoadedSettings = React.useRef(false);
  const skipNextSave = React.useRef(true);

  useEffect(() => {
    loadSettings()
      .then((settings) => {
        setSharedSettings(settings);
        hasLoadedSettings.current = true;
      })
      .catch((error) => {
        logging('error', 'useShareableState: Error loading settings', error);
      });
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings.current) return;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveSharedSettings();
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [sharedSettings]);

  const updateSharedSettings = (newSettings: any) => {
    setSharedSettings({ ...sharedSettings, ...newSettings });
  };

  const saveSharedSettings = async () => {
    let now = new Date();

    if (sharedSettings.indicateAllDayEvents_minTransparency > sharedSettings.indicateAllDayEvents_maxTransparency) {
      if (lastSavedIdError === null || now.getTime() - lastSavedDateError.getTime() > 2900) {
        setLastSavedIdError(
          toast.error('The minimum transparency cannot be higher than the maximum transparency.', {
            position: 'bottom-right',
            autoClose: 3_000,
          }),
        );
      } else {
        toast.update(lastSavedIdError, {
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
      if (lastSavedIdSuccess === null || now.getTime() - lastSavedDateSuccess.getTime() > 2900) {
        setLastSavedIdSuccess(toast.success('Saved successfully', toastConfig));
      } else {
        toast.update(lastSavedIdSuccess, {
          ...toastConfig,
          render: 'Saved successfully',
        });
      }
      setLastSavedDateSuccess(now);
    } else {
      if (lastSavedIdWarn === null || now.getTime() - lastSavedDateWarn.getTime() > 14900) {
        setLastSavedIdWarn(toast.warn('Error while saving!', toastConfig));
      } else {
        toast.update(lastSavedIdWarn, {
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
    logging('info', 'restoreDefaultSharedSettings');
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
