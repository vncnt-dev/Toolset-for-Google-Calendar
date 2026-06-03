import { Settings } from '../../interfaces/SettingsInterface';
import { storage } from '@extend-chrome/storage';
import { logging, clearAllReports } from './logger';

var defaultSettings: Settings = {
  calcDuration_isActive: true,
  calcDuration_minimumDurationMinutes: 30,
  calcDuration_durationFormat: 'hourMinutes',
  calcDuration_disableForAllDayEvents: false,
  hoverInformation_isActive: true,
  removeGMeets_isActive: true,
  indicateAllDayEvents_isActive: true,
  indicateAllDayEvents_maxTransparency: 0.9,
  indicateAllDayEvents_minTransparency: 0.5,
  indicateAllDayEvents_maxWidth: 100,
  exportAsIcs_isActive: true,
  showChangeLog_isActive: true,
  isLoggingEnabled: false,
  isReportGenerationEnabled: false,
};

let settings: Settings | undefined;
let settingsLoadPromise: Promise<Settings> | undefined;

function cloneDefaultSettings(): Settings {
  return structuredClone(defaultSettings);
}

function normalizeSettings(rawSettings: Partial<Settings> | undefined): Settings {
  const normalizedSettings = Object.assign(cloneDefaultSettings(), rawSettings);

  // migration
  // v1.2 -> v1.3: settings name changed
  // @ts-expect-error
  if (normalizedSettings.indicateFullDayEvents_isActive !== undefined) {
    // @ts-expect-error
    normalizedSettings.indicateAllDayEvents_isActive = normalizedSettings.indicateFullDayEvents_isActive;
    // @ts-expect-error
    normalizedSettings.indicateAllDayEvents_maxTransparency = normalizedSettings.indicateFullDayEvents_maxTransparency;
    // @ts-expect-error
    normalizedSettings.indicateAllDayEvents_minTransparency = normalizedSettings.indicateFullDayEvents_minTransparency;
    // @ts-expect-error
    normalizedSettings.indicateAllDayEvents_maxWidth = normalizedSettings.indicateFullDayEvents_maxWidth;
    // @ts-expect-error
    delete normalizedSettings.indicateFullDayEvents_isActive;
    // @ts-expect-error
    delete normalizedSettings.indicateFullDayEvents_maxTransparency;
    // @ts-expect-error
    delete normalizedSettings.indicateFullDayEvents_minTransparency;
    // @ts-expect-error
    delete normalizedSettings.indicateFullDayEvents_maxWidth;
  }

  // v1.6.2 -> v1.6.3
  // add isLoggingEnabled setting
  if (normalizedSettings.isLoggingEnabled === undefined) {
    normalizedSettings.isLoggingEnabled = false;
  }

  // add isReportGenerationEnabled setting
  if (normalizedSettings.isReportGenerationEnabled === undefined) {
    normalizedSettings.isReportGenerationEnabled = false;
  }

  // v1.6.5 -> v1.6.6
  // add calcDuration_disableForAllDayEvents setting
  if (normalizedSettings.calcDuration_disableForAllDayEvents === undefined) {
    normalizedSettings.calcDuration_disableForAllDayEvents = false;
  }

  return normalizedSettings;
}

function areSettingsEqual(left: Settings, right: Settings): boolean {
  return Object.keys(right).every((key) => left[key as keyof Settings] === right[key as keyof Settings]);
}

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== 'sync' || !changes.settings) return;
    const oldSettings = normalizeSettings(changes.settings.oldValue as Partial<Settings> | undefined);
    const newSettings = normalizeSettings(changes.settings.newValue as Partial<Settings> | undefined);
    settings = newSettings;

    const wasLoggingDisabled = (oldSettings.isLoggingEnabled && !newSettings.isLoggingEnabled);
    const wasReportDisabled = (oldSettings.isReportGenerationEnabled && !newSettings.isReportGenerationEnabled);
    if (wasLoggingDisabled || wasReportDisabled) {
      await clearAllReports();
    }
  });
}

function loadSettings(force = false) {
  if (!force && settings) {
    return Promise.resolve(settings);
  }

  if (!settingsLoadPromise || force) {
    settingsLoadPromise = storage.sync.get('settings').then((storedSettings) => {
      const loadedSettings = normalizeSettings(storedSettings.settings);
      settings = loadedSettings;
      return loadedSettings;
    });
  }

  return settingsLoadPromise;
}

function getSettingsSnapshot(): Settings {
  return settings ?? defaultSettings;
}

// allow subset of settings
async function saveSettings(newSettings: Partial<Settings>): Promise<boolean> {
  // delete undefined values
  (Object.keys(newSettings) as Array<keyof Settings>).forEach((key) => newSettings[key] === undefined && delete newSettings[key]);
  if (Object.keys(newSettings).length === 0) return true;

  const currentSettings = settings ?? (await loadSettings());
  const nextSettings = normalizeSettings({ ...currentSettings, ...newSettings });
  if (areSettingsEqual(currentSettings, nextSettings)) return true;

  settings = nextSettings;

  const wasLoggingDisabled = (currentSettings.isLoggingEnabled && !nextSettings.isLoggingEnabled);
  const wasReportDisabled = (currentSettings.isReportGenerationEnabled && !nextSettings.isReportGenerationEnabled);
  if (wasLoggingDisabled || wasReportDisabled) {
    await clearAllReports();
  }

  try {
    await storage.sync.set({ settings: nextSettings });
    return true;
  } catch (error) {
    logging('error', 'settings save error: ', error);
    return false;
  }
}
export { loadSettings, saveSettings, defaultSettings, getSettingsSnapshot };
