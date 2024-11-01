import ReactDOMServer from 'react-dom/server';
import { CalEvent, EventDates } from '../../interfaces/eventInterface';
import { getItemFromCache, setItemInCache } from './sessionCache';
import { UserInfo } from '../../interfaces/userInfo';

/* based on https://stackoverflow.com/a/46428456 */
function decodeDataEventId(dataEventId: string): string {
  let decoded = atob(dataEventId); // n17t3dbrekq5om2hj91t4pjefk_20221013T210000Z mail@...  -->  >id_date e-mail<
  return decoded.slice(0, decoded.indexOf(' '));
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
  if (!userInfoElement) return null;

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

function isBetweenDays(startDate: Date, endDate: Date, testDate: Date): boolean {
  const startTime = new Date(startDate).setHours(0, 0, 0, 0);
  const endTime = new Date(endDate).setHours(23, 59, 59, 999);
  const testTime = testDate.getTime();
  return startTime <= testTime && testTime <= endTime;
}

/**
 * is testDateDate in [startDate, endDate)
 */
function isBetweenDateTimes(startDate: Date, endDate: Date, date: Date): boolean {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const d = date.getTime();
  return start <= d && d < end;
}

function isSameDay(date1: Date, date2: Date): boolean {
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
  /*   correctEventTime, */
  decodeDataEventId,
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
};
