import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { fastActionsModalInit } from './fastActionsModal/fastActionsModalInit';
import { startXhrListener } from './lib/parseEventData';
import { loadSettings } from './lib/SettingsHandler';
import { loadEventCacheFromLocalStorage } from './lib/xhrEventDataCache';

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
  // Load cache on startup as base-cache
  await loadEventCacheFromLocalStorage();

  // Listen to XHR changes and rerun all tasks when they happen
  startXhrListener(handleEventDataUpdated);
  fastActionsModalInit();

  const settings = await loadSettings();
  startWorkerCompleteHTMLBody([], settings);
  startWorkerCalendarView(settings);

  // Listen to settings changes across tabs/windows using chrome.storage.onChanged
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName === 'sync' && changes.settings) {
        console.log('Settings changed');
        const nextSettings = await loadSettings(true);
        startWorkerCompleteHTMLBody([], nextSettings);
        startWorkerCalendarView(nextSettings);
      }
    });
  }
}

run();
