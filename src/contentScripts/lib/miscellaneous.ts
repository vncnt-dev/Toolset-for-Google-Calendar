import { Event } from '../../interfaces/eventInterface';

/* based on https://stackoverflow.com/a/46428456 */
function decodeDataEventId(dataEventId: string): Array<string> {
  let decoded = atob(dataEventId); // n17t3dbrekq5om2hj91t4pjefk_20221013T210000Z mail@...  -->  >id_date e-mail<
  return decoded.split(/[_ ]/);
}

let multiDayDateKeyMap: Map<string, string> = new Map();
function correctEventTime(event: Event): Date[] {
  if (event.type == 'multiDay') {
    // generate Map to get data-key of multiDay events
    if (multiDayDateKeyMap.size == 0) {
      Array.from(event.parentElement!.closest('.MVMVEe')!.childNodes[0].childNodes).forEach((el: any, index) => {
        multiDayDateKeyMap.set(index.toString(), el.getAttribute('data-key'));
      });
    }
    let index = Array.prototype.indexOf.call(event.parentElement!.closest('.rES0Be')!.children, event.parentElement!.closest('.eADW5d'));
    var startDate = getDate(parseInt(multiDayDateKeyMap.get(index.toString())!));
    var endDate = new Date(startDate.getTime() + event.duration * 60 * 1000);
  } else {
    let today: Date = getDate(parseInt(event.parentElement!.parentElement!.parentElement!.getAttribute('data-datekey')!));

    var startDate: Date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      event.eventTime[0].getHours(),
      event.eventTime[0].getMinutes(),
    );
    var endDate: Date = new Date(startDate.getTime() + event.duration * 60 * 1000);
  }
  return [startDate, endDate];
}

/* escape html */
function escapeHtml(unsafe: string) {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// trim all elements of an array
function trimArray(arr: Array<any>) {
  return arr.map(function (el) {
    return el.trim();
  });
}

/**
 * caluates day of gcal day element based on data-datekey attribute
 * source: https://stackoverflow.com/a/58081383
 * */
function getDate(dateKey: number) {
  const yearOffset = (dateKey - 32) % 512;
  const year = (dateKey - 32 - yearOffset) / 512;
  const day = yearOffset % 32;
  const month = (yearOffset - day) / 32;
  return new Date(year + 1970, month, day);
}

function isBetweenDates(startDate: Date, endDate: Date, date: Date) {
  let startYear = startDate.getFullYear();
  let startMonth = startDate.getMonth();
  let startDay = startDate.getDate();
  let endYear = endDate.getFullYear();
  let endMonth = endDate.getMonth();
  let endDay = endDate.getDate();
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();

  return (
    (year > startYear || (year === startYear && month > startMonth) || (year === startYear && month === startMonth && day >= startDay)) &&
    (year < endYear || (year === endYear && month < endMonth) || (year === endYear && month === endMonth && day <= endDay))
  );
}

function isSameDay(date1: Date, date2: Date) {
  try {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  } catch (e) {
    console.warn('isSameDay: error', e, date1, date2);
    return false;
  }
}

function deepCopy(obj: any) {
  return Object.assign({}, obj);
}

export { escapeHtml, trimArray, getDate, isBetweenDates, isSameDay, deepCopy, decodeDataEventId, correctEventTime };
