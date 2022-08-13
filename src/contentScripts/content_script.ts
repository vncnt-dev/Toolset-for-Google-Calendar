import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { preparePage } from './lib/preparePage';
import { loadSettings } from './lib/SettingsHandler';

async function run() {
  preparePage();
  await loadSettings();
  startWorkerCompleteHTMLBody();
  startWorkerCalendarView();
}

run();
