import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { fastActionsModalInit } from './fastActionsModal/fastActionsModalInit';
import { startXhrListener } from './lib/parseEventData';
import { loadSettings } from './lib/SettingsHandler';
import { loadEventCacheFromLocalStorage, resetCache } from './lib/xhrEventDataCache';
import { loadIndicatorExclusions, INDICATOR_EXCLUSIONS_STORAGE_KEY } from './lib/indicatorExclusionStore';
import { logging } from './lib/logger';

let rerunTimer: NodeJS.Timeout | null = null;
let lastRerunTime = 0;

async function rerunAllTasks() {
  const settings = await loadSettings();
  startWorkerCompleteHTMLBody([], settings);
  startWorkerCalendarView(settings);
}

function handleEventDataUpdated() {
  if (lastRerunTime + 100 < Date.now()) {
    lastRerunTime = Date.now();
    rerunAllTasks();
  } else {
    if (rerunTimer) clearTimeout(rerunTimer);
    rerunTimer = setTimeout(() => {
      lastRerunTime = Date.now();
      rerunAllTasks();
    }, 100);
  }
}

async function run() {
  const settings = await loadSettings();

  // Load cache on startup as base-cache
  await loadEventCacheFromLocalStorage();
  // Load indicator exclusion list as base-cache
  await loadIndicatorExclusions();

  // Listen to XHR changes and rerun all tasks when they happen
  startXhrListener(handleEventDataUpdated);
  fastActionsModalInit();

  startWorkerCompleteHTMLBody([], settings);
  startWorkerCalendarView(settings);

  // Listen to settings changes across tabs/windows using chrome.storage.onChanged
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName === 'sync' && changes.settings) {
        logging('info', 'Settings changed');
        const nextSettings = await loadSettings(true);
        startWorkerCompleteHTMLBody([], nextSettings);
        startWorkerCalendarView(nextSettings);
      }
      if (areaName === 'local') {
        const hasCacheCleared = Object.keys(changes).some((key) => key.startsWith('gct_event_') && !changes[key].newValue);
        if (hasCacheCleared) {
          logging('info', 'Event cache cleared in storage, resetting in-memory cache');
          resetCache();
        }
      }
      if (areaName === 'sync' && changes[INDICATOR_EXCLUSIONS_STORAGE_KEY]) {
        logging('info', 'Indicator exclusion list changed, reloading and rerunning tasks');
        await loadIndicatorExclusions(true);
        rerunAllTasks();
      }
    });
  }
}

run();
