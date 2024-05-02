import ReactDOMServer from 'react-dom/server';
import { CalEvent, EventDates } from '../../interfaces/eventInterface';
import { getItemFromCache, setItemInCache } from '../lib/cache';
import { UserInfo } from '../../interfaces/userInfo';

/* based on https://stackoverflow.com/a/46428456 */
function decodeDataEventId(dataEventId: string): string {
  let decoded = atob(dataEventId); // n17t3dbrekq5om2hj91t4pjefk_20221013T210000Z mail@...  -->  >id_date e-mail<
  return decoded.slice(0, decoded.indexOf(' '));
}

/* 
<div id="xUserInfo" aria-hidden="true" style="display:none"><div id="xUserEmail">pelz.vincent@gmail.com</div><div id="xUserName"></div><div id="xTimezone">Europe/Berlin</div><div id="xGmtOffset">7200000</div><div id="xUserLocale">de</div></div> */
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

function correctEventTime(event: CalEvent, HtmlEventId: string): EventDates {
  if (event.dates.areCorrectedTimes) return event.dates;
  const userInfo = getItemFromCache('userInfo')!;
  const duration = event.duration;
  let startDate: Date;
  let endDate: Date;

  let datekey = HtmlEventId.split('_')[1];
  if (datekey) {
    let dateString = datekey.slice(0, 4) + '-' + datekey.slice(4, 6) + '-' + datekey.slice(6, 8);
    if (datekey.includes('Z')) {
      // 20310617T230000Z
      dateString += 'T' + datekey.slice(9, 11) + ':' + datekey.slice(11, 13) + ':' + datekey.slice(13, 15) + 'Z';
    }
    startDate = new Date(dateString);
    if (isNaN(startDate.getTime())) startDate = event.dates.start;
  } else {
    startDate = event.dates.start;
  }

  // console.log(startDate, userInfo.gmtOffset, startDate.getTimezoneOffset());
  if (event.type === 'allDay') {
    startDate.setHours(0, 0);
    endDate = new Date(startDate.getTime() + (duration * 60 - 1) * 1000); // -1 because allDay should end at 23:59:59 not 00:00:00 the next day
  } else {
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
  correctEventTime,
  decodeDataEventId,
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
