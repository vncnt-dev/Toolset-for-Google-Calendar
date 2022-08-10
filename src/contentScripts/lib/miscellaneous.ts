/** calculate difference between start and end date in minutes */
function calculateDuration(startEndDateTime: Date[]): number {
  try {
    return (startEndDateTime[1].getTime() - startEndDateTime[0].getTime()) / 1000 / 60;
  } catch (e) {
    console.log('calculateDuration: error', e, startEndDateTime);
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
      break;
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

/* get name of event */
function getEventName(parentElement: HTMLElement): string {
  let el = (parentElement.querySelector('.FAxxKc') ?? parentElement.querySelector('.yzifAd')) as HTMLElement;
  return el.innerText;
}

/* escape html */
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    (year > startYear ||
      (year === startYear && month > startMonth) ||
      (year === startYear && month === startMonth && day >= startDay)) &&
    (year < endYear ||
      (year === endYear && month < endMonth) ||
      (year === endYear && month === endMonth && day <= endDay))
  );
}

function isSameDate(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export { calculateDuration, formatDuration, getEventName, escapeHtml, trimArray, getDate, isBetweenDates, isSameDate };
