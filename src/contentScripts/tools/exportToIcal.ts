import { getItemFromCache } from '../lib/cache';
import { Event } from '../../interfaces/eventInterface';

const exportToIcalPrepare = () => {
  const menuItem = Array.from(document.querySelectorAll('ul.VfPpkd-StrnGf-rymPhb.DMZ54e')).filter((ulElement) => {
    return (ulElement.parentNode as HTMLElement).hasAttribute('data-eventid');
  })[0];

  let exportToIcalMenuItem = document.querySelector('#exportToIcalMenuItem');
  if (exportToIcalMenuItem || !menuItem) {
    return;
  }
  exportToIcalMenuItem = document.createElement('li');
  exportToIcalMenuItem.id = 'exportToIcalMenuItem';
  exportToIcalMenuItem.className = 'OwNvm taKRZe VfPpkd-StrnGf-rymPhb-ibnC6b';
  exportToIcalMenuItem.setAttribute('role', 'menuitem');
  exportToIcalMenuItem.setAttribute('tabindex', '-1');
  exportToIcalMenuItem.innerHTML = `
    <span class="VfPpkd-StrnGf-rymPhb-pZXsl"></span>
    <span class="VfPpkd-StrnGf-rymPhb-b9t22c">Export to iCal</span>
  `;
  exportToIcalMenuItem.addEventListener('click', () => {
    exportToIcal();
  });
  menuItem.appendChild(exportToIcalMenuItem);
};

const exportToIcal = () => {
  const popupView = document.getElementById('xDetDlg');
  if (!popupView) return;

  const activeEventId = popupView.getAttribute('data-eventid');
  if (!activeEventId) return;

  const eventStorage: Event[] = getItemFromCache('eventStorage') || [];
  const activeEvent = eventStorage.find((event) => event.parentElement?.getAttribute('data-eventid') === activeEventId);
  if (!activeEvent) return;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  /* https://datatracker.ietf.org/doc/html/rfc5545 */
  const icalString = `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//Google Inc//Google Calendar 70.9054//EN\r
CALSCALE:GREGORIAN\r
X-WR-TIMEZONE:${timeZone}\r
${generateVTimeZone(timeZone)}\r
BEGIN:VEVENT\r
UID:${activeEvent.id}@google.com\r
DTSTAMP;TZID=${timeZone}:${formatDateToIcal(new Date())}\r
DTSTART;TZID=${timeZone}:${formatDateToIcal(activeEvent.time[0])}\r
DTEND;TZID=${timeZone}:${formatDateToIcal(activeEvent.time[1])}\r
DESCRIPTION:${activeEvent.description ?? ''}\r
LOCATION:${activeEvent.location ?? ''}\r
${activeEvent.recurrenceRule ? `RRULE:${activeEvent.recurrenceRule}\r` : ''}\
SUMMARY:${activeEvent.name}\r
END:VEVENT\r
END:VCALENDAR`;
  console.log(icalString);
  // only keep: letters, numbers, spaces, dots, dashes
  downloadStringAsFile(icalString, activeEvent.name.replace(/[^\w\s\.-\d]/g, '-') + '.ics');
};

function formatDateToIcal(date: Date) {
  return date.toISOString().replace(/[-:.]/g, '').slice(0, -4);
}

function generateVTimeZone(timeZone: string) {
  const offsetToString = (offset: number) => {
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    return `${sign}${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
  };

  const jan = new Date(2020, 0, 1);
  const jul = new Date(2020, 6, 1);
  let standardOffset = jan.getTimezoneOffset();
  let daylightOffset = jul.getTimezoneOffset();

  return `BEGIN:VTIMEZONE\r
TZID:${timeZone}\r
BEGIN:DAYLIGHT\r
TZOFFSETFROM:${offsetToString(standardOffset)}\r
TZOFFSETTO:${offsetToString(daylightOffset)}\r
TZNAME:Daylight Saving Time\r
DTSTART:19700329T020000\r
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r
END:DAYLIGHT\r
BEGIN:STANDARD\r
TZOFFSETFROM:${offsetToString(daylightOffset)}\r
TZOFFSETTO:${offsetToString(standardOffset)}\r
TZNAME:Standard Time\r
DTSTART:19701101T030000\r
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r
END:STANDARD\r
END:VTIMEZONE`;
}
function downloadStringAsFile(string: string, filename: string) {
  const blob = new Blob([string], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export { exportToIcalPrepare };
/* 
TRANSP:OPAQUE https://www.kanzaki.com/docs/ical/transp.html This property defines whether an event is transparent or not to busy time searches.
LAST-MODIFIED:
*/
