import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { preparePage } from './lib/preparePage';
import { loadSettings } from './lib/SettingsHandler';
import { startXhrListener } from './lib/parseEventData';

async function run() {
  await loadSettings();
  startXhrListener();
  preparePage();
  startWorkerCompleteHTMLBody();
  startWorkerCalendarView();
}

run();
