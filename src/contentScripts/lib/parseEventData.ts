import { Event } from '../../interfaces/eventInterface';
import { settings } from '../lib/SettingsHandler';
import { observerCalendarViewFunction } from '../tools/MutationObserverHandler';

function startXhrListener() {
  insertScriptToPage('xhook.min.js');
  insertScriptToPage('XHRInterceptor.js');

  // Event listener
  document.addEventListener('GCT_XMLHttpRequest', function (event: CustomEventInit) {
    let req = event.detail as XMLHttpRequest;
    if (req.responseURL.includes('calendar.google.com/calendar/u/0/sync.prefetcheventrange')) {
      // this is called when the calendar is initially loaded
      let data = JSON.parse(escapeJsonString(req.responseText.slice(6)))[0][2][1];
      updateEventData(data);
    } else if (req.responseURL.includes('calendar.google.com/calendar/u/0/sync.sync')) {
      // this is called when an event is added or edited
      let data = JSON.parse(escapeJsonString(req.responseText.slice(6)))[0][2][3][0][1][0][3];
      let initDataStrcucture = [['', [data]]];
      updateEventData(initDataStrcucture);
    }
  });
}

var eventData: Record<string, Event> = {};

var updateEventData = function (XhrData: Array<any>) {
  try {
    XhrData.forEach((calender: any) => {
      // every calender has an array of events
      calender[1].forEach((event: any) => {
        let eventTime: Date[] = getEventTime(event) as Date[];
        let eventDuration = calculateDuration(eventTime);
        let newEvent: Event = {
          id: event[0],
          eventTime: eventTime,
          duration: eventDuration,
          eventLocation: event[7],
          durationFormated: formatDuration(eventDuration, settings.calcDuration_durationFormat, settings.calcDuration_minimumDurationMinutes),
          eventName: event[5],
          eventCalendar: getEventCalendar(event),
        };
        Object.assign(eventData, { [newEvent.id]: newEvent });
      });
    });
    // call observerCalendarViewFunction to make shure, that the displayed info is up to date
    observerCalendarViewFunction();
  } catch (error) {}
};

function insertScriptToPage(file: string) {
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('/web_accessible_resources/' + file);
  (document.head || document.documentElement).appendChild(s);
  s.onload = function () {
    s.remove();
  };
}

function getEventTime(event: Array<any>): Array<Date> | null {
  if (event[35].length == 1) {
    return [new Date(event[35][0]), new Date(event[36][0])];
  } else if (event[35].length == 3) {
    return [new Date(event[35][1][0]), new Date(event[36][1][0])];
  }
  return null;
}

/** calculate difference between start and end date in minutes */
function calculateDuration(startEndDateTime: Date[]): number {
  try {
    return (startEndDateTime[1].getTime() - startEndDateTime[0].getTime()) / 1000 / 60;
  } catch (e) {
    console.warn('calculateDuration: error', e, startEndDateTime);
    return 0;
  }
}

/* Format Date */
function formatDuration(diff: number, format: string, minDurationMinutes: number): string | null {
  // if diff is less than minDurationMinutes, return nothing
  if (minDurationMinutes && diff < minDurationMinutes / 60) return null;
  switch (format) {
    case 'decimalHours':
      var durationInHours = diff / 60;
      if (durationInHours % 24 > 23.99) durationInHours = Math.ceil(durationInHours);
      if (durationInHours < 24) return durationInHours.toFixed(2) + ' ' + (durationInHours <= 1 ? 'hour' : 'hours');
      // duration of full and multi-day events in days rather than hours
      let durationInDays = durationInHours / 24;
      return durationInDays.toFixed(2) + ' ' + (durationInDays > 1 ? 'days' : 'day');
    case 'hourMinutes': // is default case
    default:
      var durationInHours = diff / 60;

      if (durationInHours % 24 > 23.99)
        // if 23:59, round up to 24 hours
        durationInHours = Math.ceil(durationInHours);

      let hours = Math.floor(durationInHours);
      let minutes = Math.floor((durationInHours - hours) * 60);

      // also display days if duration is greater than 24 hours
      let days: number = 0;
      if (durationInHours >= 24) {
        days = Math.floor(durationInHours / 24);
        hours = hours - days * 24;
      }

      let returnString = '';
      if (days > 0) returnString += days + 'd ';
      if (hours > 0) returnString += hours + 'h ';
      if (minutes > 0) returnString += minutes + 'm';

      return returnString.trim();
  }
}

function getEventCalendar(event: Array<any>): [string, string] {
  if (event[34][1] !== null) return [event[34][1], event[34][0]];
  return [event[34][0], event[34][0]];
}

var escapeJsonString = function (str: String) {
  return str
    .replace(/[\\]/g, '\\\\')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t')
    .replace(/[^,\[](")[^,\]]/g, function (match) {
      // replace all " that are within a string
      return match.replace(/"/g, "'");
    });
};

export { startXhrListener, eventData };
