import { Event } from '../../interfaces/eventInterface';
import { settings } from '../lib/SettingsHandler';
import * as Tools from './tools';
import { eventData } from '../lib/parseEventData';
import { correctEventTime, decodeDataEventId, deepCopy } from '../lib/miscellaneous';
import { resetCache, getItemFromCache, setItemInCache } from '../lib/cache';
import { exportToIcalPrepare } from './tools';

MutationObserver = window.MutationObserver;

var timer: NodeJS.Timeout,
  lastTime: number = 0;

var observerCalendarViewFunction = function () {
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
var observerCalendarView = new MutationObserver(observerCalendarViewFunction);
var observerCompleteHTMLBody = new MutationObserver(function () {
  startWorkerCompleteHTMLBody();
});

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

function startWorkerCalendarView() {
  resetCache();
  var eventStorage: Event[] = [];
  observerCalendarView.disconnect();
  try {
    let eventList: NodeListOf<HTMLElement> = document.querySelectorAll('div[role="button"][data-eventid]');
    for (let eventElement of eventList) {
      let eventIdObj = decodeDataEventId(eventElement.getAttribute('data-eventid')!);
      // a single event of a series can be edited, creating an exception that overwrites the original event for that one event
      // first one is for exceptions, second one is for the original event (series + one-time-events)
      let thisEvent: Event = eventData[eventIdObj[0] + '_' + eventIdObj[1]] || eventData[eventIdObj[0]];
      if (!thisEvent) continue;
      thisEvent.parentElement = eventElement;
      let eventTimeElement = eventElement.querySelector('.Jmftzc.gVNoLb.EiZ8Dd,.A6wOnd:not(.event-duration)') as HTMLElement;
      thisEvent.eventTimeElement = eventTimeElement;
      // very short events (>1h) have a diffenent HTML structure
      thisEvent.type = eventTimeElement.classList.contains('A6wOnd') ? 'short' : 'normal';
      thisEvent.eventTime = correctEventTime(thisEvent);
      eventStorage.push(deepCopy(thisEvent));
    }

    // multiDay events have to be handled separately, because there HTML structure is different
    let multiDayEventList: NodeListOf<HTMLElement> = document.querySelectorAll('.g3dbUc.jKgTF.QGRmIf:not(.PU9jSd)');
    for (let eventTimeElement of multiDayEventList) {
      let eventIdObj = decodeDataEventId(eventTimeElement.parentElement!.getAttribute('data-eventid')!);
      // a single event of a series can be edited, creating an exception that overwrites the original event for that one event
      // first one is for exceptions, second one is for the original event (series + one-time-events)
      let thisEvent: Event = eventData[eventIdObj[0] + '_' + eventIdObj[1]] || eventData[eventIdObj[0]];
      if (!thisEvent) continue;
      thisEvent.eventTimeElement = eventTimeElement;
      thisEvent.parentElement = eventTimeElement.parentElement!;
      thisEvent.type = 'multiDay';
      thisEvent.eventTime = correctEventTime(thisEvent);
      eventStorage.push(deepCopy(thisEvent));
    }

    let multiDayEvents: Event[] = [];
    for (let thisEvent of eventStorage) {
      if (!thisEvent.parentElement || !thisEvent.eventTimeElement) continue;
      if (settings.calcDuration_isActive) {
        Tools.injectDuration(thisEvent);
      }
      Tools.addHoverOverInformation(thisEvent);
      if (thisEvent.type === 'multiDay') {
        multiDayEvents.push(thisEvent);
      }
    }
    multiDayEvents = multiDayEvents.filter((event, index, self) => self.findIndex((t) => t.id === event.id) === index); // remove double entries
    if (settings.indicateFullDayEvents_isActive) Tools.indicateFullDayEvents(multiDayEvents);
    exportToIcalPrepare();

    setItemInCache('eventStorage', eventStorage);
    setItemInCache('multiDayEvents', multiDayEvents);
  } catch (error) {
    console.error('GC Tools - error: ', error);
  } finally {
    createObserverCalendarView();
  }
}

function startWorkerCompleteHTMLBody() {
  observerCompleteHTMLBody.disconnect();
  if (settings.betterAddMeeting_isActive) Tools.betterAddMeeting();

  createObserverCompleteHTMLBody();
}

export { startWorkerCalendarView, startWorkerCompleteHTMLBody, observerCalendarViewFunction };
