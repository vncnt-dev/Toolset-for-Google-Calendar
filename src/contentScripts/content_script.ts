import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { fastActionsModalInit } from './fastActionsModal/fastActionsModalInit';
import { loadSettings } from './lib/SettingsHandler';
import { startXhrListener } from './lib/parseEventData';

async function run() {
  await loadSettings();
  startXhrListener();
  fastActionsModalInit();
  startWorkerCompleteHTMLBody();
  startWorkerCalendarView();
}

run();
