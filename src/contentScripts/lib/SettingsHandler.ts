import { Settings } from '../../interfaces/SettingsInterface';
import { storage } from '@extend-chrome/storage';

var defaultSettings: Settings = {
  calcDuration_isActive: true,
  calcDuration_minimumDurationMinutes: 30,
  calcDuration_durationFormat: 'hourMinutes',
  hoverInformation_isActive: true,
  removeGMeets_isActive: true,
  indicateAllDayEvents_isActive: true,
  indicateAllDayEvents_maxTransparency: 0.9,
  indicateAllDayEvents_minTransparency: 0.5,
  indicateAllDayEvents_maxWidth: 100,
  exportAsIcs_isActive: true,
  showChangeLog_isActive: true,
};

var settings: Settings;

function loadSettings(force = false) {
  if (force || !settings) {
    return storage.sync.get('settings').then((e) => {
      settings = Object.assign(structuredClone(defaultSettings), e.settings);

      // migration
      // v1.2 -> v1.3
      // @ts-expect-error
      if (settings.indicateFullDayEvents_isActive !== undefined) {
        // @ts-expect-error
        settings.indicateAllDayEvents_isActive = settings.indicateFullDayEvents_isActive;
        // @ts-expect-error
        settings.indicateAllDayEvents_maxTransparency = settings.indicateFullDayEvents_maxTransparency;
        // @ts-expect-error
        settings.indicateAllDayEvents_minTransparency = settings.indicateFullDayEvents_minTransparency;
        // @ts-expect-error
        settings.indicateAllDayEvents_maxWidth = settings.indicateFullDayEvents_maxWidth;
        // @ts-expect-error
        delete settings.indicateFullDayEvents_isActive;
        // @ts-expect-error
        delete settings.indicateFullDayEvents_maxTransparency;
        // @ts-expect-error
        delete settings.indicateFullDayEvents_minTransparency;
        // @ts-expect-error
        delete settings.indicateFullDayEvents_maxWidth;
        saveSettings(settings);
      }

      return settings;
    });
  } else {
    return new Promise<Settings>((resolve) => {
      resolve(settings);
    });
  }
}

// allow subset of settings
function saveSettings(newSettings: Partial<Settings>): Promise<boolean> {
  // delete undefined values
  (Object.keys(newSettings) as Array<keyof Settings>).forEach((key) => newSettings[key] === undefined && delete newSettings[key]);
  if (!settings || Object.keys(newSettings).length === 0) return Promise.resolve(true);

  settings = Object.assign(structuredClone(settings), newSettings);
  return storage.sync
    .set({ settings: settings })
    .then((e) => {
      return true;
    })
    .catch((error) => {
      console.warn('GC Tools - settings save error: ', error);
      return false;
    });
}
export { loadSettings, saveSettings, defaultSettings };
