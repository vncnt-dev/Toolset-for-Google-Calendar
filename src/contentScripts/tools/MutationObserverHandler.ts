import { CalEvent } from '../../interfaces/eventInterface';
import { loadSettings } from '../lib/settingsHandler';
import * as Tools from './tools';

import { getEventXhrDataById } from '../lib/parseEventData';
import { decodeDataEventId, getUserInfo, logging } from '../lib/miscellaneous';
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

async function startWorkerCalendarView() {
  logging('info', 'startWorkerCalendarView');
  let settings = await loadSettings();
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
        eventId = decodeDataEventId(calEventHtmlElement.getAttribute('data-eventid')!);
        const thisEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!thisEvent) continue;

        thisEvent.parentElement = calEventHtmlElement;
        thisEvent.timeElement = (calEventHtmlElement.querySelector('div.lhydbb.gVNoLb.EiZ8Dd:not(.event-duration)') ||
          calEventHtmlElement.querySelector('.EWOIrf:not(.event-duration)')) as HTMLElement;

        if (!thisEvent.timeElement) {
          logging('warn', 'event without timeElement, will be skipped: ', thisEvent, calEventHtmlElement);
          return;
        }
        // very short events (>1h) have a diffenent HTML structure
        if (thisEvent.timeElement?.classList.contains('EWOIrf')) thisEvent.type = 'short';

        if (!thisEvent.dates.start || !thisEvent.dates.end) continue;

        eventStorage = eventStorage.filter((event) => event.parentElement !== thisEvent.parentElement);
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
      try {
        let eventId = decodeDataEventId(calEventHtmlElement.parentElement!.getAttribute('data-eventid')!);
        let thisEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!thisEvent) continue;

        thisEvent.parentElement = calEventHtmlElement.parentElement!;
        thisEvent.timeElement = calEventHtmlElement;
        if (!thisEvent.dates.start || !thisEvent.dates.end) continue;
        if (thisEvent.type === 'allDay') {
          const startDate = thisEvent.dates.start.getOriginalJsDateObject().setHours(0, 0, 0, 0);
          const endDate = new Date(startDate + (thisEvent.durationInMinutes - 1) * 60 * 1000);
          thisEvent.dates.start.setDisableTzCorrection(true).setDate(new Date(startDate));
          thisEvent.dates.end.setDisableTzCorrection(true).setDate(new Date(endDate));
        }
        allOrMultiDayEventStorage = allOrMultiDayEventStorage.filter((event) => event.parentElement !== thisEvent.parentElement);
        allOrMultiDayEventStorage.push(thisEvent);
        eventStorage.push({ ...thisEvent });
      } catch (error) {
        logging('error', 'error while parsing allOrMultiDay event: ', error, calEventHtmlElement);
      }
    }

    for (let thisEvent of eventStorage) {
      if (!thisEvent.parentElement || !thisEvent.timeElement) continue;
      Tools.addHoverOverInformation(thisEvent);
      if (settings.calcDuration_isActive) Tools.injectDuration(thisEvent);
    }

    if (settings.indicateAllDayEvents_isActive) Tools.indicateAllDayEvents(allOrMultiDayEventStorage);
    if (settings.exportAsIcs_isActive) Tools.exportToIcalPrepare();

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

async function startWorkerCompleteHTMLBody(mutationsList: MutationRecord[] = []) {
  const settings = await loadSettings();
  disconnectObserver();
  if (settings.removeGMeets_isActive) Tools.removeGMeets();

  createObserver();
}

export { startWorkerCalendarView, startWorkerCompleteHTMLBody, observerCalendarViewFunction };
