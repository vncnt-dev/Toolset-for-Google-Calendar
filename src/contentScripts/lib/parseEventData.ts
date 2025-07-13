import { CalEvent, EventDates } from '../../interfaces/eventInterface';
import { loadSettings } from '../lib/SettingsHandler';
import { observerCalendarViewFunction } from '../tools/MutationObserverHandler';
import * as xhrEventDataCache from './xhrEventDataCache';

function startXhrListener() {
  insertScriptToPage('XHRInterceptor', true); // intercepts all XHR requests and dispatches them as a custom event
  // Event listener
  document.addEventListener('GCT_XMLHttpRequest', function (event: CustomEventInit) {
    try {
      let req = event.detail as XMLHttpRequest;
      const url = req?.responseURL?.toString() || '';
      if (!url.includes('calendar.google.com')) return;
      if (url.includes('/sync.prefetcheventrange')) {
        console.log('GC Tools - xhr event - sync.prefetcheventrange', req);
        try {
          // this is called when the calendar is initially loaded
          let data = JSON.parse(escapeJsonString(req.responseText))[0][2][1];
          updateXhrEventData(data);
        } catch (error) {
          console.warn('GCT_XMLHttpRequest-init', error);
        }
      } else if (url.includes('/sync.sync')) {
        // this is called when an event is added or edited
        try {
          console.log('GC Tools - xhr event - sync.sync', req);
          let responseAsJson = JSON.parse(escapeJsonString(req.responseText));
          // if no events are in the response, return (this is the case when an event is deleted
          let data;
          try {
            data = responseAsJson[0][2][3][0][1][0][3];
          } catch (error) {
            return;
          }

          if (!data) return;
          let initDataStrcucture = [['', [data]]]; // mock structure to match the structure of the initial data
          updateXhrEventData(initDataStrcucture);
        } catch (error) {
          console.warn('GCT_XMLHttpRequest-update', error);
        }
      }
    } catch (error) {
      console.warn('GCT_XMLHttpRequest', error, event);
    }
  });
}

function getEventXhrDataById(HtmlEventId: string): CalEvent | undefined {
  /* 
  every event (series) has an id
  for single events, the HTML Element of an event holds the id in the data-eventid attribute "eventid ..."
  for event series, the HTML Element of an event holds the date of this element and event id of the series "eventid_currentDate ..."

  xhrEventData uses "eventid" for single events and and event series
  but if the user edits an event within a series an exception is created, which is stored in xhrEventData as "eventid_currentDate"
  
  to get the correct event from xhrEventData, we have to check for "eventid_currentDate" first because there might be an exception for this Date,
  and only if there is no exception, we need to check for "eventid"
  */
  let event: CalEvent | undefined = xhrEventDataCache.getItemFromCache(HtmlEventId) || xhrEventDataCache.getItemFromCache(HtmlEventId.split('_')[0]); // check for "eventid_currentDate" or "eventid"
  if (!event) {
    console.log('GC Tools - warning: event not found in xhrEventData: ', HtmlEventId);
    return;
  }

  return event;
}
async function updateXhrEventData(XhrData: Array<any>) {
  let settings = await loadSettings();
  /* console.log('GC Tools - updateEventData', XhrData); */
  try {
    console.log('GC Tools - updateEventData: ', XhrData);
    XhrData.forEach((calender: any) => {
      // every calender has an array of events
      if (!calender[1]) return;
      const newEventData: CalEvent[] = calender[1].forEach((xhrEventEntry: Array<any>) => {
        let eventTimeArray: Date[] = getEventTimeArray(xhrEventEntry) as Date[];
        if (!eventTimeArray) return;
        let eventDuration = calculateDurationInMinutes(eventTimeArray);
        let recurrenceRuleString = JSON.parse(`"${xhrEventEntry[12]?.[0] ?? ''}"`);

        let newEvent: CalEvent = {
          id: xhrEventEntry[0],
          dataEntryCreatedAt: new Date(),
          dates: { start: eventTimeArray[0], end: eventTimeArray[1], areCorrectedTimes: false },
          duration: eventDuration,
          location: xhrEventEntry[7]?.trim(),
          durationFormated: formatDuration(eventDuration, settings.calcDuration_durationFormat, settings.calcDuration_minimumDurationMinutes),
          name: stripHtmlTags(decodeUnicodeString(xhrEventEntry[5]?.trim())),
          description: stripHtmlTags(decodeUnicodeString(xhrEventEntry[64]?.[1]?.trim())),
          calendar: getEventCalendar(xhrEventEntry),
          recurrenceRule: recurrenceRuleString?.slice(recurrenceRuleString.indexOf(':') + 1),
        };

        newEvent.type = 'normal';
        if (eventDuration >= 24 * 60) {
          if (isAllDayEvent(newEvent.dates)) {
            newEvent.type = 'allDay';
          } else {
            newEvent.type = 'nonAllDayMultiDay';
          }
        }
        xhrEventDataCache.setItemInCache(newEvent.id, newEvent);
      });
    });
    // call observerCalendarViewFunction to make sure, that the displayed info is up to date
    observerCalendarViewFunction();
  } catch (error) {
    console.log('GC Tools - updateEventData: ', error);
  }
}

function insertScriptToPage(file: string, isModule: boolean = false) {
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('/web_accessible_resources/' + file + '.js');
  s.type = isModule ? 'module' : 'text/javascript';
  (document.head || document.documentElement).appendChild(s);
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
function calculateDurationInMinutes(startEndDateTime: Date[]): number {
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

function isAllDayEvent(eventTime: EventDates): boolean {
  return (
    eventTime.start.getHours() + eventTime.start.getTimezoneOffset() / 60 == 0 &&
    eventTime.start.getMinutes() == 0 &&
    eventTime.end.getHours() + eventTime.end.getTimezoneOffset() / 60 == 0 &&
    eventTime.end.getMinutes() == 0
  );
}

function getEventCalendar(event: Array<any>): { id: string; name: string } {
  const [id, name] = event[34];
  return { id, name: name ?? id };
}

/**
 * The rest-reponse of the Google Calendar is not valid JSON, so we have to escape it before we can parse it
 */
function escapeJsonString(str: String) {
  return str
    .slice(6)
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
    })
    .trim();
}

/** replace all \uXXXX unicode characters with the corresponding character */
function decodeUnicodeString(input: string): string {
  if (!input) return '';

  try {
    const decoded = input.replace(/\\u[\dA-Fa-f]{4}/g, (match) => String.fromCharCode(parseInt(match.replace('\\u', ''), 16)));
    return decoded;
  } catch (e) {
    console.warn('decodeUnicodeString: error', e, input);
    return input;
  }
}

/**
 * this is mainly used to get rid of <a> tags that google calendar creates for links in the description
 * @param html
 * @returns
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || '';
  } catch (e) {
    console.warn('stripHtmlTags: error', e, html);
    return html;
  }
}

export { startXhrListener, getEventXhrDataById };
