import { startWorkerCalenderView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { preparePage } from './lib/preparePage';
import { loadSettings } from './lib/SettingsHandler';

function run() {
  preparePage();
  loadSettings();
  startWorkerCompleteHTMLBody();
  startWorkerCalenderView();
}

run();
