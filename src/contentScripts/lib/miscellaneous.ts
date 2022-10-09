

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

function isSameDate(date1: Date, date2: Date) {
  try {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
  } catch (e) {
    console.warn('isSameDate: error', e, date1, date2);
    return false;
  }
}

export { escapeHtml, trimArray, getDate, isBetweenDates, isSameDate};
