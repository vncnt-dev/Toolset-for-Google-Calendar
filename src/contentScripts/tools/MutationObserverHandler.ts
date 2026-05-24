import { CalEvent } from '../../interfaces/eventInterface';
import type { Settings } from '../../interfaces/SettingsInterface';
import { loadSettings } from '../lib/SettingsHandler';
import * as Tools from './tools';

import { getEventXhrDataById } from '../lib/parseEventData';
import { decodeDataEventId, getUserInfo, logging } from '../lib/miscellaneous';
import { CustomDateHandler } from '../lib/customDateHandler';
import { resetCache, setItemInCache } from '../lib/sessionCache';

MutationObserver = window.MutationObserver;
const observerCalendarView = new MutationObserver((mutationsList, observer) => {
  observerCalendarViewFunction(mutationsList);
});
const observerCompleteHTMLBody = new MutationObserver((mutationsList, observer) => {
  startWorkerCompleteHTMLBody(mutationsList);
});

function createObserver() {
  createObserverCalendarView();
  createObserverCompleteHTMLBody();
}

function disconnectObserver() {
  observerCalendarView.disconnect();
  observerCompleteHTMLBody.disconnect();
}

function createObserverCalendarView() {
  observerCalendarView.observe(document.querySelector('#YPCqFe')!, {
    subtree: true,
    childList: true,
  });
}

function createObserverCompleteHTMLBody() {
  observerCompleteHTMLBody.observe(document.querySelector('body')!, {
    subtree: true,
    childList: true,
  });
}

var timer: NodeJS.Timeout;
var lastTime: number = 0;
function observerCalendarViewFunction(mutationsList: MutationRecord[] = []) {
  // if lasttime is at least 100 ms ago, run worker, else wait until lasttime is at least 100 ms ago
  if (lastTime + 100 < Date.now()) {
    lastTime = Date.now();
    startWorkerCalendarView();
  } else {
    clearTimeout(timer);
    timer = setTimeout(function () {
      lastTime = Date.now();
      startWorkerCalendarView();
    }, Date.now() - lastTime);
  }
}

async function startWorkerCalendarView(settingsOverride?: Settings) {
  logging('info', 'startWorkerCalendarView');
  let settings = settingsOverride ?? (await loadSettings());
  resetCache();
  setItemInCache('userInfo', getUserInfo());
  /**
   * contains information about all events of the current view, including allOrMultiDay events
   */
  var eventStorage: CalEvent[] = [];
  /**
   * contains information about all allOrMultiDay events of the current view
   */
  var allOrMultiDayEventStorage: CalEvent[] = [];
  disconnectObserver();
  try {
    let calEventList: NodeListOf<HTMLElement> = document.querySelectorAll('div[role="button"][data-eventid]');
    // events that are >24h or "full day" have to be handled separately, because there HTML structure is different
    let allOrMultiDayCalEventList: NodeListOf<HTMLElement> = document.querySelectorAll('.KF4T6b.jKgTF:not(.PU9jSd)');

    for (let calEventHtmlElement of calEventList) {
      let eventId = '';
      try {
        const dataEventId = calEventHtmlElement.getAttribute('data-eventid')!;
        if (dataEventId.startsWith('tasks_')) {
          logging('debug', 'skipping tasks event: ', dataEventId);
          continue;
        }
        eventId = decodeDataEventId(dataEventId);
        const originalEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!originalEvent) continue;

        const thisEvent: CalEvent = { ...originalEvent };
        if (originalEvent.dates) {
          thisEvent.dates = {
            start: originalEvent.dates.start
              ? new CustomDateHandler(new Date(originalEvent.dates.start.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.start,
            end: originalEvent.dates.end
              ? new CustomDateHandler(new Date(originalEvent.dates.end.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.end,
          };
        }

        thisEvent.parentElement = calEventHtmlElement;
        thisEvent.timeElement = (calEventHtmlElement.querySelector('div.lhydbb.gVNoLb.EiZ8Dd:not(.event-duration)') ||
          calEventHtmlElement.querySelector('.EWOIrf:not(.event-duration)')) as HTMLElement;

        if (!thisEvent.timeElement) {
          logging('warn', 'event without timeElement, will be skipped: ', thisEvent, calEventHtmlElement);
          continue;
        }
        // very short events (>1h) have a diffenent HTML structure
        if (thisEvent.timeElement?.classList.contains('EWOIrf')) thisEvent.type = 'short';

        if (!thisEvent.dates.start || !thisEvent.dates.end) continue;

        eventStorage.push({ ...thisEvent });
      } catch (error) {
        let errorMessage = '';
        if (error instanceof Error) errorMessage = error.message;
        else if (error instanceof Object) errorMessage = JSON.stringify(error);
        else errorMessage = error as string;
        logging('error', 'error while parsing event: ', eventId, errorMessage, calEventHtmlElement);
      }
    }

    for (let calEventHtmlElement of allOrMultiDayCalEventList) {
      let eventId = '';
      try {
        const dataEventId = calEventHtmlElement.parentElement!.getAttribute('data-eventid');
        if (!dataEventId) {
          logging('warn', 'no data-eventid found in allOrMultiDay event: ', calEventHtmlElement);
          continue;
        }
        if (dataEventId.startsWith('tasks_')) {
          logging('debug', 'skipping tasks event: ', dataEventId);
          continue;
        }
        eventId = decodeDataEventId(dataEventId);

        let originalEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!originalEvent) continue;

        let thisEvent: CalEvent = { ...originalEvent };
        if (originalEvent.dates) {
          thisEvent.dates = {
            start: originalEvent.dates.start
              ? new CustomDateHandler(new Date(originalEvent.dates.start.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.start,
            end: originalEvent.dates.end
              ? new CustomDateHandler(new Date(originalEvent.dates.end.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.end,
          };
        }

        thisEvent.parentElement = calEventHtmlElement.parentElement!;
        thisEvent.timeElement = calEventHtmlElement;
        if (!thisEvent.dates.start || !thisEvent.dates.end) continue;
        if (thisEvent.type === 'allDay') {
          const startDate = thisEvent.dates.start.getOriginalJsDateObject().setHours(0, 0, 0, 0);
          const endDate = new Date(startDate + (thisEvent.durationInMinutes - 1) * 60 * 1000);
          thisEvent.dates.start.setDisableTzCorrection(true).setDate(new Date(startDate));
          thisEvent.dates.end.setDisableTzCorrection(true).setDate(new Date(endDate));
        }
        allOrMultiDayEventStorage.push(thisEvent);
        eventStorage.push({ ...thisEvent });
      } catch (error) {
        logging('error', 'error while parsing allOrMultiDay event: ', eventId, error, calEventHtmlElement);
      }
    }

    for (let thisEvent of eventStorage) {
      if (!thisEvent.parentElement || !thisEvent.timeElement) continue;
      Tools.addHoverOverInformation(thisEvent);
      if (settings.calcDuration_isActive) Tools.injectDuration(thisEvent, settings);
    }

    if (settings.indicateAllDayEvents_isActive) Tools.indicateAllDayEvents(allOrMultiDayEventStorage, settings);

    logging('info', 'events number: ', eventStorage.length, ' storage: ', eventStorage);
    logging('info', 'allOrMultiDayEvents number: ', allOrMultiDayEventStorage.length, ' storage: ', allOrMultiDayEventStorage);
    setItemInCache('eventStorage', eventStorage);
    setItemInCache('allOrMultiDayEvents', allOrMultiDayEventStorage);
  } catch (error) {
    logging('error', 'error: ', error);
  } finally {
    createObserver();
  }
}

async function startWorkerCompleteHTMLBody(mutationsList: MutationRecord[] = [], settingsOverride?: Settings) {
  const settings = settingsOverride ?? (await loadSettings());
  disconnectObserver();
  if (settings.removeGMeets_isActive) Tools.removeGMeets();
  if (settings.exportAsIcs_isActive) Tools.exportToIcalPrepare();
  createObserver();
}

export { startWorkerCalendarView, startWorkerCompleteHTMLBody, observerCalendarViewFunction };
