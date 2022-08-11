import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { preparePage } from './lib/preparePage';
import { loadSettings } from './lib/SettingsHandler';

function run() {
  preparePage();
  loadSettings();
  startWorkerCompleteHTMLBody();
  startWorkerCalendarView();
}

run();
