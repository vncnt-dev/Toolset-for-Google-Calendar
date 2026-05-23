import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { fastActionsModalInit } from './fastActionsModal/fastActionsModalInit';
import { startXhrListener } from './lib/parseEventData';
import { loadSettings } from './lib/SettingsHandler';
import { observerCalendarViewFunction } from './tools/MutationObserverHandler';

async function run() {
  startXhrListener(observerCalendarViewFunction);
  fastActionsModalInit();

  const settings = await loadSettings();
  startWorkerCompleteHTMLBody([], settings);
  startWorkerCalendarView(settings);
}

run();
