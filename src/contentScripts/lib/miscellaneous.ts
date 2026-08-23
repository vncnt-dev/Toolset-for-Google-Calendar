import ReactDOMServer from 'react-dom/server';
import type { ReactNode } from 'react';
import ICAL from 'ical.js';
import type { CalEvent } from '../../interfaces/eventInterface';
import { UserInfo } from '../../interfaces/userInfo';
import { CustomDateHandler } from './customDateHandler';
import { getSettingsSnapshot } from './SettingsHandler';
import { logging } from './logger';

/* based on https://stackoverflow.com/a/46428456 */
function decodeDataEventId(dataEventId: string): string {
  return decodeDataEventIdFull(dataEventId).id;
}

/**
 * like decodeDataEventId, but also returns the occurrence date of recurring event occurrences.
 * f.e. "<seriesId>_20221013T210000Z" -> { id: "<seriesId>", occurrenceDate: "20221013T210000Z" }
 */
function decodeDataEventIdFull(dataEventId: string): { id: string; occurrenceDate?: string } {
  if (dataEventId.includes('_')) dataEventId = dataEventId.split('_')[1]; // f.e. birthdays have an id like: bday_<encodedId></encodedId>, while normal events have just <encodedId>
  let decoded = atob(dataEventId); // n17t3dbrekq5om2hj91t4pjefk_20221013T210000Z mail@...  -->  >id_date e-mail<
  const token = decoded.slice(0, decoded.indexOf(' '));
  const underscoreIndex = token.indexOf('_');
  if (underscoreIndex === -1) return { id: token };
  return { id: token.slice(0, underscoreIndex), occurrenceDate: token.slice(underscoreIndex + 1) };
}

async function calculateHashSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/* 
<div id="xUserInfo" aria-hidden="true" style="display:none"><div id="xUserEmail">xyz@gmail.com</div><div id="xUserName"></div><div id="xTimezone">Europe/Berlin</div><div id="xGmtOffset">7200000</div><div id="xUserLocale">de</div></div> */
function getUserInfo(): UserInfo | null {
  let userInfoElement = document.getElementById('xUserInfo');
  if (!userInfoElement) {
    logging('error', 'getUserInfo: userInfoElement not found');
    return null;
  }

  let queryUserInfoElement = (selector: string) => userInfoElement!.querySelector(selector)?.textContent ?? null;
  let gmtOffset: string | number | null = queryUserInfoElement('#xGmtOffset');
  if (typeof gmtOffset === 'string')
    gmtOffset = -(parseInt(gmtOffset) / 1000 / 60) + 60; // +60 because google seems to base the timezone offset on the DST not normal time
  else gmtOffset = new Date().getTimezoneOffset();

  let userInfo: UserInfo = {
    email: queryUserInfoElement('#xUserEmail'),
    name: queryUserInfoElement('#xUserName'),
    timezone: queryUserInfoElement('#xTimezone'),
    gmtOffset: gmtOffset,
    locale: queryUserInfoElement('#xUserLocale'),
  };
  return userInfo;
}

/* escape html */
function escapeHtml(unsafe: string): string {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// trim all elements of an array
function trimArray(arr: Array<String>): Array<String> {
  return arr.map(function (el) {
    return el.trim();
  });
}

/**
 * caluates day based on data-datekey attribute
 * source: https://stackoverflow.com/a/58081383
 * */
function getDateFromDateKey(dateKey: number): Date {
  const yearOffset = (dateKey - 32) % 512;
  const year = (dateKey - 32 - yearOffset) / 512;
  const day = yearOffset % 32;
  const month = (yearOffset - day) / 32;
  return new Date(year + 1970, month, day, 0, 0, 0, 0);
}

function isBetweenDays(event: CalEvent, testDateInput: Date | CustomDateHandler): boolean {
  const startDate = resolveDate(event.dates.start);
  const endDate = resolveDate(event.dates.end);
  const testDate = resolveDate(testDateInput);

  if (!event.recurrenceRule) {
    return isWithinDayRange(startDate, endDate, testDate);
  }

  return isWithinRecurringRange(startDate, endDate, testDate, event.recurrenceRule) || isWithinDayRange(startDate, endDate, testDate);
}

function resolveDate(date: Date | CustomDateHandler): Date {
  return date instanceof CustomDateHandler ? date.getJsDateObject() : new Date(date.getTime());
}

function isWithinDayRange(startDate: Date, endDate: Date, testDate: Date): boolean {
  const startTime = new Date(startDate.getTime());
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date(endDate.getTime());
  endTime.setHours(23, 59, 59, 999);

  const testTime = testDate.getTime();
  return startTime.getTime() <= testTime && testTime <= endTime.getTime();
}

function isWithinRecurringRange(startDate: Date, endDate: Date, testDate: Date, recurrenceRule: string): boolean {
  try {
    const recur = ICAL.Recur.fromString(recurrenceRule.startsWith('RRULE:') ? recurrenceRule.slice(6) : recurrenceRule);
    const iterator = recur.iterator(ICAL.Time.fromJSDate(startDate));
    const eventDuration = endDate.getTime() - startDate.getTime();
    const testStart = new Date(testDate.getTime());
    testStart.setHours(0, 0, 0, 0);
    const testEnd = new Date(testDate.getTime());
    testEnd.setHours(23, 59, 59, 999);

    let nextOccurrence;
    while ((nextOccurrence = iterator.next())) {
      const occurrenceStart = nextOccurrence.toJSDate();
      const occurrenceEnd = new Date(occurrenceStart.getTime() + eventDuration);

      if (occurrenceStart.getTime() > testEnd.getTime()) {
        return false;
      }

      if (occurrenceStart.getTime() <= testEnd.getTime() && occurrenceEnd.getTime() >= testStart.getTime()) {
        return true;
      }
    }
  } catch (error) {
    logging('warn', 'isBetweenDays: failed to evaluate recurrence rule', recurrenceRule, error);
  }

  return false;
}

/**
 * is testDateDate in [startDate, endDate)
 */
/**
 * parses google compact date tokens f.e. "20250106", "20250106T210000Z".
 * date-only tokens (all-day events) are interpreted as LOCAL midnight,
 * timed tokens as absolute UTC times.
 */
function parseCompactDateToken(token?: string): number | undefined {
  if (!token) return undefined;
  const match = /^([0-9]{4})([0-9]{2})([0-9]{2})(?:T([0-9]{2})([0-9]{2}))?[0-9]{0,2}Z?$/.exec(token);
  if (!match) return undefined;
  const [, year, month, day, hours, minutes] = match;
  if (hours !== undefined) return Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime();
}

/**
 * end of an occurrence = its start + event duration.
 * all-day occurrences span whole LOCAL days and end at 23:59 of their last day
 * (google convention f.e. "...T21:59Z"), so date displays stay on the actual last day.
 */
function getOccurrenceEndDate(event: CalEvent, occurrenceStartMs?: number): number | undefined {
  const start = occurrenceStartMs ?? (event.dates?.start ? event.dates.start.getJsDateObject().getTime() : undefined);
  if (start === undefined) return undefined;

  if (event.type === 'allDay') {
    const days = Math.max(1, Math.round(event.durationInMinutes / 1440));
    const startDay = new Date(start);
    return new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + days - 1, 23, 59).getTime();
  }
  return start + event.durationInMinutes * 60 * 1000;
}

/**
 * extracts the end of a recurring series:
 * - "UNTIL=" in the rule -> that date
 * - no UNTIL but "COUNT=n" -> expand the recurrence and use end of the n-th occurrence
 * - neither (infinite series) -> undefined, such entries should never be pruned/displayed as ended
 */
function getRecurrenceEndDate(event: CalEvent): number | undefined {
  const recurrenceRule = event.recurrenceRule;
  if (!recurrenceRule || !event.dates?.start) return undefined;

  const untilMatch = /UNTIL=([0-9]{8}(?:T[0-9]{6}Z)?)/.exec(recurrenceRule);
  if (untilMatch) return parseCompactDateToken(untilMatch[1]);

  const countMatch = /COUNT=([0-9]+)/.exec(recurrenceRule);
  if (!countMatch) return undefined;

  try {
    const recur = ICAL.Recur.fromString(recurrenceRule.startsWith('RRULE:') ? recurrenceRule.slice(6) : recurrenceRule);
    const iterator = recur.iterator(ICAL.Time.fromJSDate(event.dates.start.getOriginalJsDateObject()));
    const count = parseInt(countMatch[1]);
    let lastOccurrence: ICAL.Time | undefined;
    for (let i = 0; i < count; i++) {
      const next = iterator.next();
      if (!next) break;
      lastOccurrence = next;
    }
    if (!lastOccurrence) return undefined;
    return getOccurrenceEndDate(event, lastOccurrence.toJSDate().getTime());
  } catch (error) {
    logging('warn', 'getRecurrenceEndDate: failed to expand COUNT rule', recurrenceRule, error);
    return undefined;
  }
}

function isBetweenDateTimes(startDate: Date | CustomDateHandler, endDate: Date | CustomDateHandler, date: Date | CustomDateHandler): boolean {
  if (startDate instanceof CustomDateHandler) startDate = startDate.getJsDateObject();
  if (endDate instanceof CustomDateHandler) endDate = endDate.getJsDateObject();
  if (date instanceof CustomDateHandler) date = date.getJsDateObject();
  const start = startDate.getTime();
  const end = endDate.getTime();
  const d = date.getTime();
  return start <= d && d < end;
}

function isSameDay(date1: Date | CustomDateHandler, date2: Date | CustomDateHandler): boolean {
  if (date1 instanceof CustomDateHandler) date1 = date1.getJsDateObject();
  if (date2 instanceof CustomDateHandler) date2 = date2.getJsDateObject();
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

function downloadStringAsFile(string: string, filename: string) {
  const blob = new Blob([string], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function JsxElementToHtmlElement(jsxElement: ReactNode): HTMLElement {
  return htmlStringToHtmlElement(ReactDOMServer.renderToStaticMarkup(jsxElement));
}

function htmlStringToHtmlElement(html: string): HTMLElement {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return (template.content.firstChild as HTMLElement) ?? document.createElement('div');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  decodeDataEventId,
  decodeDataEventIdFull,
  calculateHashSha256,
  downloadStringAsFile,
  escapeHtml,
  getDateFromDateKey,
  getUserInfo,
  htmlStringToHtmlElement,
  isBetweenDateTimes,
  isBetweenDays,
  isSameDay,
  JsxElementToHtmlElement,
  trimArray,
  logging,
  sleep,
  parseCompactDateToken,
  getOccurrenceEndDate,
  getRecurrenceEndDate,
};
