import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { preparePage } from './lib/preparePage';
import { loadSettings } from './lib/SettingsHandler';

async function run() {
  await loadSettings();
  preparePage();
  startWorkerCompleteHTMLBody();
  startWorkerCalendarView();
}

run();
