import { CalEvent } from '../../interfaces/eventInterface';
import { loadSettings } from '../lib/SettingsHandler';
import * as Tools from './tools';
import { getEventXhrDataById } from '../lib/parseEventData';
import { correctEventTime, decodeDataEventId, getUserInfo } from '../lib/miscellaneous';
import { resetCache, setItemInCache } from '../lib/cache';

MutationObserver = window.MutationObserver;
const observerCalendarView = new MutationObserver(observerCalendarViewFunction);
const observerCompleteHTMLBody = new MutationObserver(startWorkerCompleteHTMLBody);

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
function observerCalendarViewFunction () {
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
};

async function startWorkerCalendarView() {
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
  observerCalendarView.disconnect();
  try {
    let calEventList: NodeListOf<HTMLElement> = document.querySelectorAll('div[role="button"][data-eventid]');
    // events that are >24h or "full day" have to be handled separately, because there HTML structure is different
    let allOrMultiDayCalEventList: NodeListOf<HTMLElement> = document.querySelectorAll('.g3dbUc.jKgTF.QGRmIf:not(.PU9jSd)');

    for (let calEventHtmlElement of calEventList) {
      try {
        let eventId = decodeDataEventId(calEventHtmlElement.getAttribute('data-eventid')!);
        let thisEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!thisEvent) continue;

        thisEvent.parentElement = calEventHtmlElement;
        thisEvent.timeElement = calEventHtmlElement.querySelector('.Jmftzc.gVNoLb.EiZ8Dd,.A6wOnd:not(.event-duration)') as HTMLElement;
        // very short events (>1h) have a diffenent HTML structure
        if (thisEvent.timeElement.classList.contains('A6wOnd')) {
          thisEvent.type = 'short';
        }
        thisEvent.dates = correctEventTime(thisEvent,eventId);

        eventStorage.push(thisEvent);
      } catch (error) {
        console.error('GC Tools - error while parsing event: ', error);
      }
    }

    for (let calEventHtmlElement of allOrMultiDayCalEventList) {
      try {
        let eventId = decodeDataEventId(calEventHtmlElement.parentElement!.getAttribute('data-eventid')!);
        let thisEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!thisEvent) continue;

        thisEvent.parentElement = calEventHtmlElement.parentElement!;
        thisEvent.timeElement = calEventHtmlElement;

        thisEvent.dates = correctEventTime(thisEvent,eventId);

        allOrMultiDayEventStorage.push(thisEvent);
        eventStorage.push(thisEvent);
      } catch (error) {
        console.error('GC Tools - error while parsing allOrMultiDay event: ', error);
      }
    }

    for (let thisEvent of eventStorage) {
      if (!thisEvent.parentElement || !thisEvent.timeElement) continue;
      Tools.addHoverOverInformation(thisEvent);
      if (settings.calcDuration_isActive) Tools.injectDuration(thisEvent);
    }

    if (settings.indicateAllDayEvents_isActive) Tools.indicateAllDayEvents(allOrMultiDayEventStorage);
    if (settings.exportAsIcs_isActive) Tools.exportToIcalPrepare();

    console.log('GC Tools - eventStorage: ', eventStorage);
    console.log('GC Tools - allOrMultiDayEvents: ', allOrMultiDayEventStorage);
    setItemInCache('eventStorage', eventStorage);
    setItemInCache('allOrMultiDayEvents', allOrMultiDayEventStorage);
  } catch (error) {
    console.error('GC Tools - error: ', error);
  } finally {
    createObserverCalendarView();
  }
}

async function startWorkerCompleteHTMLBody() {
  let settings = await loadSettings();
  observerCompleteHTMLBody.disconnect();
  if (settings.betterAddMeeting_isActive) Tools.betterAddMeeting();

  createObserverCompleteHTMLBody();
}

export { startWorkerCalendarView, startWorkerCompleteHTMLBody, observerCalendarViewFunction };
