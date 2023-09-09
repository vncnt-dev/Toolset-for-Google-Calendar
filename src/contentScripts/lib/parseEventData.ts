import { Event } from '../../interfaces/eventInterface';
import { loadSettings } from '../lib/SettingsHandler';
import { observerCalendarViewFunction } from '../tools/MutationObserverHandler';

function startXhrListener() {
  insertScriptToPage('xhook.min.js');
  insertScriptToPage('XHRInterceptor.js');

  // Event listener
  document.addEventListener('GCT_XMLHttpRequest', function (event: CustomEventInit) {
    try {
      let req = event.detail as XMLHttpRequest;
      if (req.responseURL.includes('calendar.google.com/calendar/u/0/sync.prefetcheventrange')) {
        try {
          // this is called when the calendar is initially loaded
          let data = JSON.parse(escapeJsonString(req.responseText.slice(6)))[0][2][1];
          updateEventData(data);
        } catch (error) {
          console.warn('GCT_XMLHttpRequest-init', error, JSON.parse(escapeJsonString(req.responseText.slice(6))) || req.responseText);
        }
      } else if (req.responseURL.includes('calendar.google.com/calendar/u/0/sync.sync')) {
        try {
          // this is called when an event is added or edited
          let responseAsJson = JSON.parse(escapeJsonString(req.responseText.slice(6)));
          // if no events are in the response, return (this is the case when an event is deleted
          let data = responseAsJson[0][2][3][0][1][0][3];
          let initDataStrcucture = [['', [data]]];
          updateEventData(initDataStrcucture);
        } catch (error) {
          /* console.warn('GCT_XMLHttpRequest-update', error, JSON.parse(escapeJsonString(req.responseText.slice(6))) || req.responseText); */
        }
      }
    } catch (error) {
      console.warn('GCT_XMLHttpRequest', error, event);
    }
  });
}
var eventData: Record<string, Event> = {};

var updateEventData = async function (XhrData: Array<any>) {
  let settings = await loadSettings();
  /* console.log('GC Tools - updateEventData', XhrData); */
  try {
    XhrData.forEach((calender: any) => {
      // every calender has an array of events
      const newEventData = calender[1].reduce((acc: any, event: any) => {
        let eventTimeArray: Date[] = getEventTimeArray(event) as Date[];
        if (!eventTimeArray) return acc;
        let eventDuration = calculateDuration(eventTimeArray);
        let recurrenceRuleString = JSON.parse(`"${event[12]?.[0] ?? ''}"`);
        let newEvent: Event = {
          id: event[0],
          dates: { start: eventTimeArray[0], end: eventTimeArray[1], areCorrectedTimes: false },
          duration: eventDuration,
          location: event[7]?.trim(),
          durationFormated: formatDuration(eventDuration, settings.calcDuration_durationFormat, settings.calcDuration_minimumDurationMinutes),
          name: event[5]?.trim(),
          description: event[64]?.[1]?.trim(),
          calendar: getEventCalendar(event),
          recurrenceRule: recurrenceRuleString?.slice(recurrenceRuleString.indexOf(':') + 1),
        };
        return { ...acc, [newEvent.id]: newEvent };
      }, {});
      eventData = { ...eventData, ...newEventData };
    });
    // call observerCalendarViewFunction to make shure, that the displayed info is up to date
    observerCalendarViewFunction();
  } catch (error) {
    console.log('GC Tools - updateEventData: ', error);
  }
};

function insertScriptToPage(file: string) {
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('/web_accessible_resources/' + file);
  (document.head || document.documentElement).appendChild(s);
  s.onload = function () {
    s.remove();
  };
}

function getEventTimeArray(event: Array<any>): Array<Date> | null {
  if (!event?.[35]) return null;
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
  if (minDurationMinutes && diff < minDurationMinutes) return null;
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

function getEventCalendar(event: Array<any>): { id: string; name: string } {
  const [id, name] = event[34];
  return { id, name: name ?? id };
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
