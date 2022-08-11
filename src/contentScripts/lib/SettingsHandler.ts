import { Settings } from '../../interfaces/SettingsInterface';
import { storage } from '@extend-chrome/storage';

var defaultSettings: Settings = {
  calcDuration_isActive: true,
  calcDuration_minimumDurationMinutes: 30,
  calcDuration_durationFormat: 'hourMinutes',
  hoverInformation_isActive: true,
  betterAddMeeting_isActive: true,
};

var settings: Settings = defaultSettings;

function loadSettings() {
  return storage.sync.get('settings').then((e) => {
    console.log('GC Tools - getSettings: ', e.settings);
    settings = e.settings;
    return e.settings ?? defaultSettings;
  });
}

function saveSettings(settings: Settings, suppressNotification:boolean = false): void {
  storage.sync
    .set({ settings: settings })
    .then((e) => {
      console.log('GC Tools - settings saved', e);
    })
    .catch((error) => {
      console.error('GC Tools - settings save error: ', error);
    });
}

export { settings, loadSettings, saveSettings, defaultSettings };
