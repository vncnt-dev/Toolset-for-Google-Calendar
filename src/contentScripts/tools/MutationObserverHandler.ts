import { Event } from '../../interfaces/eventInterface';
import { settings } from '../lib/SettingsHandler';
import { calculateDuration, formatDuration, getEventName } from '../lib/miscellaneous';
import { getEventTime } from '../lib/eventTimeParser';
import * as Tools from './tools';

MutationObserver = window.MutationObserver;

var timer: NodeJS.Timer,
  lastTime: number = 0;
var observerCalendarView = new MutationObserver(function () {
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
});
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

var eventStorage: Event[] = [];
function startWorkerCalendarView() {
  observerCalendarView.disconnect();
  eventStorage = [];
  try {
    let eventList: NodeListOf<HTMLElement> = document
      .querySelector('#YPCqFe')!
      .querySelectorAll('.Jmftzc.gVNoLb.EiZ8Dd, .A6wOnd:not(.event-duration)');
    eventList.forEach((eventTimeElement) => {
      // get event display type (normal or small) and  metadata of eventTimeElement
      let eventMetadata;
      let newEvent: Event = {} as Event;

      try {
        newEvent.eventTimeElement = eventTimeElement;
        // very short events (>1h) have a diffenent HTML structure
        if (eventTimeElement.classList.contains('A6wOnd')) {
          newEvent.type = 'short';
          newEvent.parentElement = eventTimeElement.parentElement!.parentElement!.parentElement!.parentElement!.parentElement!;
          eventMetadata = (eventTimeElement.parentElement!.parentElement!.parentElement!.parentElement!.previousSibling! as HTMLElement).innerText;
        } else {
          newEvent.type = 'normal';
          newEvent.parentElement = eventTimeElement.parentElement!.parentElement!.parentElement!;
          eventMetadata = (eventTimeElement.parentElement!.parentElement!.previousSibling! as HTMLElement).innerText;
        }
      } catch (error) {
        console.error('GC Tools - error: ', error, 'on', eventTimeElement);
        return;
      }

      newEvent.eventTime = getEventTime(eventMetadata);
      let eventDateMetadata = (newEvent.parentElement.querySelector('.ynRLnc')! as HTMLElement).innerText;
      newEvent.duration = calculateDuration(newEvent.eventTime);
      newEvent.durationFormated = formatDuration(
        newEvent.duration,
        settings.calcDuration_durationFormat,
        settings.calcDuration_minimumDurationMinutes,
      );
      newEvent.eventName = getEventName(newEvent.parentElement);
      eventStorage.push(newEvent);
    });

    // multiDay events have to be handled separately, because there HTML structure is different
    let multiDayEventList: NodeListOf<HTMLElement> = document.querySelectorAll('.g3dbUc.jKgTF.QGRmIf:not(.PU9jSd)');
    multiDayEventList.forEach((eventTimeElement) => {
      let newEvent: Event = {} as Event;
      newEvent.eventTimeElement = eventTimeElement;
      newEvent.type = 'multiDay';
      newEvent.parentElement = eventTimeElement.parentElement!;
      let eventMetadata = (newEvent.parentElement.querySelector('.ynRLnc')! as HTMLElement).innerText;
      newEvent.eventTime = getEventTime(eventMetadata);

      newEvent.duration = newEvent.duration = calculateDuration(newEvent.eventTime);
      newEvent.durationFormated = formatDuration(
        newEvent.duration,
        settings.calcDuration_durationFormat,
        settings.calcDuration_minimumDurationMinutes,
      );
      newEvent.eventName = getEventName(newEvent.parentElement);
      eventStorage.push(newEvent);
    });
    console.log('GC Tools - eventStorage: ', eventStorage);
    // worker for all event types
    eventStorage.forEach((eventObject, eventIndex) => {
      // per event actions
      if (settings.calcDuration_isActive) Tools.injectDuration(eventObject);

      Tools.addHoverOverInformation(eventObject);
    });

    // worker for multiDayevents only
    /* let multiDayevents = eventStorage.filter(event => event.type === "multiDay")
                 multiDayevents.forEach((eventObject, eventIndex) => {
                    
                }); */
    Tools.indicateFullDayEvents(eventStorage.filter((event) => event.type === 'multiDay'));
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

export { startWorkerCalendarView, startWorkerCompleteHTMLBody };
