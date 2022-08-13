import { Settings } from '../../interfaces/SettingsInterface';
import { storage } from '@extend-chrome/storage';

var defaultSettings: Settings = {
  calcDuration_isActive: true,
  calcDuration_minimumDurationMinutes: 30,
  calcDuration_durationFormat: 'hourMinutes',
  hoverInformation_isActive: true,
  betterAddMeeting_isActive: true,
  indicateFullDayEvents_isActive: true,
};

var settings: Settings = defaultSettings;

function loadSettings() {
  return storage.sync.get('settings').then((e) => {
    console.log('GC Tools - getSettings: ', e.settings);
    settings = e.settings ?? defaultSettings;
    return settings;
  });
}

function saveSettings(settings: Settings): Promise<boolean> {
  return storage.sync
    .set({ settings: settings })
    .then((e) => {
      console.log('GC Tools - saveSettings: ', e); 
      return true;
    })
    .catch((error) => {
      console.warn('GC Tools - settings save error: ', error);
      return false;
    });
}
export { settings, loadSettings, saveSettings, defaultSettings };
