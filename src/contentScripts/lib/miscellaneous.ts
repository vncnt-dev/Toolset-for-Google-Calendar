import ReactDOMServer from 'react-dom/server';
import { UserInfo } from '../../interfaces/userInfo';
import { CustomDateHandler } from './customDateHandler';
import { loadSettings } from './settingsHandler';

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

function isBetweenDays(startDate: Date | CustomDateHandler, endDate: Date | CustomDateHandler, testDate: Date | CustomDateHandler): boolean {
  if (startDate instanceof CustomDateHandler) startDate = startDate.getJsDateObject();
  if (endDate instanceof CustomDateHandler) endDate = endDate.getJsDateObject();
  if (testDate instanceof CustomDateHandler) testDate = testDate.getJsDateObject();

  const startTime = startDate.setHours(0, 0, 0, 0);
  const endTime = endDate.setHours(23, 59, 59, 999);
  const testTime = testDate.getTime();
  return startTime <= testTime && testTime <= endTime;
}

/**
 * is testDateDate in [startDate, endDate)
 */
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

function JsxElementToHtmlElement(jsxElement: JSX.Element): HTMLElement {
  return htmlStringToHtmlElement(ReactDOMServer.renderToStaticMarkup(jsxElement));
}

function htmlStringToHtmlElement(html: string): HTMLElement {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return (template.content.firstChild as HTMLElement) ?? document.createElement('div');
}

async function logging(Level: 'debug' | 'info' | 'warn' | 'error' | 'log', ...args: any[]) {
  const settings = await loadSettings();
  if (settings.isLoggingEnabled) {
    if (Level === 'warn') console.log('%cGC Tools - Warning:', 'color: orange; font-weight: bold;', ...args);
    else if (Level === 'error') console.error('%cGC Tools - Error:', 'color: #ff416d; font-weight: bold;', ...args);
    else if (Level === 'info') console.info('%cGC Tools - Info:', 'color: #4b99d2; font-weight: bold;', ...args);
    else if (Level === 'debug') console.debug('%cGC Tools - Debug:', 'color: #55b080; font-weight: bold;', ...args);
    else {
      console.log('%cGC Tools - Log:', 'color: black;', ...args);
    }
  }
}

export {
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
  logging,
};
