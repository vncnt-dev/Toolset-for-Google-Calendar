import { Event } from '../../interfaces/eventInterface';
import { getItemFromCache, setItemInCache } from '../lib/cache';

/* based on https://stackoverflow.com/a/46428456 */
function decodeDataEventId(dataEventId: string): Array<string> {
  let decoded = atob(dataEventId); // n17t3dbrekq5om2hj91t4pjefk_20221013T210000Z mail@...  -->  >id_date e-mail<
  return decoded.split(/[_ ]/);
}

function correctEventTime(event: Event): Date[] {
  const multiDayDateKeyMap = getItemFromCache('multiDayDateKeyMap') || new Map<string, string>();
  if (event.type === 'multiDay') {
    // generate Map to get data-key of multiDay events
    if (multiDayDateKeyMap.size === 0) {
      Array.from(event.parentElement?.closest('.MVMVEe')?.childNodes[0]?.childNodes || []).forEach((el: any, index) => {
        multiDayDateKeyMap.set(index.toString(), el.getAttribute('data-datekey'));
      });
      setItemInCache('multiDayDateKeyMap', multiDayDateKeyMap);
    }
    const index = Array.prototype.indexOf.call(event.parentElement?.closest('.rES0Be')?.children, event.parentElement?.closest('.eADW5d'));
    const startDate = getDateFromDateKey(parseInt(multiDayDateKeyMap.get(index.toString())!));
    const endDate = new Date();
    endDate.setTime(startDate.getTime() + event.duration * 60 * 1000);
    return [startDate, endDate];
  } else {
    const duration = event.duration;
    const eventTime = event.time[0];
    const datekey = event.parentElement?.parentElement?.parentElement?.getAttribute('data-datekey')!;
    const today = getDateFromDateKey(parseInt(datekey));

    const startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), eventTime.getHours(), eventTime.getMinutes()));
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
    return [startDate, endDate];
  }
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
 * caluates day of gcal day element based on data-datekey attribute
 * source: https://stackoverflow.com/a/58081383
 * */
function getDateFromDateKey(dateKey: number): Date {
  const yearOffset = (dateKey - 32) % 512;
  const year = (dateKey - 32 - yearOffset) / 512;
  const day = yearOffset % 32;
  const month = (yearOffset - day) / 32;
  return new Date(year + 1970, month, day, 0, 0, 0, 0);
}

function isBetweenDays(startDate: Date, endDate: Date, betweenDate: Date): boolean {
  const start = new Date(1971, startDate.getMonth(), startDate.getDate()).getTime();
  const end = new Date(1971, endDate.getMonth(), endDate.getDate()).getTime();
  const test = new Date(1971, betweenDate.getMonth(), betweenDate.getDate()).getTime();
  return start <= test && test <= end;
}

function isBetweenDates(startDate: Date, endDate: Date, date: Date): boolean {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const d = date.getTime();
  return start <= d && d <= end;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

function deepCopy<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    console.error('deepCopy: ', obj, ' is not an object');
    return obj;
  }
  return { ...obj };
}

export { escapeHtml, trimArray, getDateFromDateKey, isBetweenDays, isBetweenDates, isSameDay, deepCopy, decodeDataEventId, correctEventTime };
