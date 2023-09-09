import { startWorkerCalendarView, startWorkerCompleteHTMLBody } from './tools/MutationObserverHandler';
import { fastActionsModalInit } from './fastActionsModal/fastActionsModalInit';
import { startXhrListener } from './lib/parseEventData';

async function run() {
  startXhrListener();
  fastActionsModalInit();
  startWorkerCompleteHTMLBody();
  startWorkerCalendarView();
}

run();
