import { Event } from '../../interfaces/eventInterface';
import { settings } from '../lib/SettingsHandler';
import * as Tools from './tools';
import { eventData } from '../lib/parseEventData';

MutationObserver = window.MutationObserver;

var timer: NodeJS.Timer,
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
}
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
  observerCalendarView.disconnect();
  try {
    let eventList: NodeListOf<HTMLElement> = document.querySelectorAll('div[role="button"][data-eventid]');
    eventList.forEach((eventElement) => {
      // get event display type (normal or small) and  metadata of eventTimeElement
      let thisEvent: Event = eventData[eventElement.getAttribute('data-eventid')!];
      if (!thisEvent) return;
      thisEvent.parentElement = eventElement;
      let eventTimeElement = eventElement.querySelector(".Jmftzc.gVNoLb.EiZ8Dd,.A6wOnd:not(.event-duration)") as HTMLElement;
      thisEvent.eventTimeElement = eventTimeElement;
      // very short events (>1h) have a diffenent HTML structure
      thisEvent.type = eventTimeElement.classList.contains('A6wOnd') ? 'short' : 'normal';
    });

    // multiDay events have to be handled separately, because there HTML structure is different
    let multiDayEventList: NodeListOf<HTMLElement> = document.querySelectorAll('.g3dbUc.jKgTF.QGRmIf:not(.PU9jSd)');
    multiDayEventList.forEach((eventTimeElement) => {
      let thisEvent: Event = eventData[eventTimeElement!.parentElement!.getAttribute('data-eventid')!];
      if (!thisEvent) return;
      thisEvent.eventTimeElement = eventTimeElement;
      thisEvent.type = 'multiDay';
      thisEvent.parentElement = eventTimeElement.parentElement!;
    });

    // array of all multiday events
    let multiDayEvents: Event[] = [];
    // Apply Tools
    for (let eventId in eventData) {
      let thisEvent: Event = eventData[eventId];
      // run only if parrentElement and eventTimeElement are set
      if(!thisEvent.parentElement || !thisEvent.eventTimeElement) continue;

      if (settings.calcDuration_isActive) Tools.injectDuration(thisEvent);
      Tools.addHoverOverInformation(thisEvent);
      if (thisEvent.type === 'multiDay') multiDayEvents.push(thisEvent);
    }
    Tools.indicateFullDayEvents(multiDayEvents);
  } catch (error) {
    console.log('GC Tools - error: ', error);
  } finally {
    createObserverCalendarView();
  }
}

function startWorkerCompleteHTMLBody() {
  observerCompleteHTMLBody.disconnect();
  if (settings.betterAddMeeting_isActive) Tools.betterAddMeeting();

  createObserverCompleteHTMLBody();
}

export { startWorkerCalendarView, startWorkerCompleteHTMLBody,observerCalendarViewFunction };
