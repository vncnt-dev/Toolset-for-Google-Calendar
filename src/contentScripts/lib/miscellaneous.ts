import ReactDOMServer from 'react-dom/server';
import { Event, EventDates } from '../../interfaces/eventInterface';
import { getItemFromCache, setItemInCache } from '../lib/cache';
import { UserInfo } from '../../interfaces/userInfo';
import { start } from 'repl';

/* based on https://stackoverflow.com/a/46428456 */
function decodeDataEventId(dataEventId: string): Array<string> {
  let decoded = atob(dataEventId); // n17t3dbrekq5om2hj91t4pjefk_20221013T210000Z mail@...  -->  >id_date e-mail<
  return decoded.split(/[_ ]/);
}

/* 
<div id="xUserInfo" aria-hidden="true" style="display:none"><div id="xUserEmail">pelz.vincent@gmail.com</div><div id="xUserName"></div><div id="xTimezone">Europe/Berlin</div><div id="xGmtOffset">7200000</div><div id="xUserLocale">de</div></div> */
function getUserInfo(): UserInfo | null {
  let userInfoElement = document.getElementById('xUserInfo');
  if (!userInfoElement) return null;
  let gmtOffset: string | number | null = userInfoElement.querySelector('#xGmtOffset')?.textContent ?? null;
  if (typeof gmtOffset === 'string') gmtOffset = -(parseInt(gmtOffset) / 1000 / 60);

  let userInfo: UserInfo = {
    email: userInfoElement.querySelector('#xUserEmail')?.textContent ?? null,
    name: userInfoElement.querySelector('#xUserName')?.textContent ?? null,
    timezone: userInfoElement.querySelector('#xTimezone')?.textContent ?? null,
    gmtOffset: gmtOffset ? gmtOffset : new Date().getTimezoneOffset(),
    locale: userInfoElement.querySelector('#xUserLocale')?.textContent ?? null,
  };
  return userInfo;
}

function correctEventTime(event: Event): EventDates {
  if(event.dates.areCorrectedTimes) return event.dates;
  const multiDayDateKeyMap = getItemFromCache('multiDayDateKeyMap') || new Map<string, string>();
  let userInfo = getItemFromCache('userInfo')!;
  let startDate: Date, endDate: Date;
  if (event.type === 'multiDay') {
    // generate Map to get data-key of multiDay events
    if (multiDayDateKeyMap.size === 0) {
      Array.from(event.parentElement?.closest('.MVMVEe')?.childNodes[0]?.childNodes || []).forEach((el: any, index) => {
        multiDayDateKeyMap.set(index.toString(), el.getAttribute('data-datekey'));
      });
      setItemInCache('multiDayDateKeyMap', multiDayDateKeyMap);
    }
    const index = Array.prototype.indexOf.call(event.parentElement?.closest('.rES0Be')?.children, event.parentElement?.closest('.eADW5d'));
    startDate = getDateFromDateKey(parseInt(multiDayDateKeyMap.get(index.toString())!));
    startDate.setHours(event.dates.start.getHours(), event.dates.start.getMinutes());
    if (userInfo.gmtOffset && startDate.getTimezoneOffset() != userInfo.gmtOffset) {
      startDate.setTime(startDate.getTime() + (startDate.getTimezoneOffset() - userInfo.gmtOffset) * 60 * 1000);
    }
    endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);
  } else {
    const duration = event.duration;
    const eventTime = event.dates.start;
    const datekey = event.parentElement?.parentElement?.parentElement?.getAttribute('data-datekey')!;
    const today = getDateFromDateKey(parseInt(datekey));

    startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eventTime.getHours(), eventTime.getMinutes());
    if (userInfo.gmtOffset && startDate.getTimezoneOffset() != userInfo.gmtOffset) {
      startDate.setTime(startDate.getTime() + (startDate.getTimezoneOffset() - userInfo.gmtOffset) * 60 * 1000);
    }
    endDate = new Date(startDate.getTime() + duration * 60 * 1000);
  }
  return { start: startDate, end: endDate, areCorrectedTimes: true };
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

function downloadStringAsFile(string: string, filename: string) {
  const blob = new Blob([string], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function JsxElementToHtmlElement(jsxElement: JSX.Element): HTMLElement {
  return htmlStringToHtmlElement(ReactDOMServer.renderToStaticMarkup(jsxElement));
}

function htmlStringToHtmlElement(html: string): HTMLElement {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return (template.content.firstChild as HTMLElement) ?? document.createElement('div');
}

export {
  escapeHtml,
  trimArray,
  getDateFromDateKey,
  isBetweenDays,
  isBetweenDates,
  isSameDay,
  deepCopy,
  decodeDataEventId,
  correctEventTime,
  downloadStringAsFile,
  JsxElementToHtmlElement,
  htmlStringToHtmlElement,
  getUserInfo,
};
