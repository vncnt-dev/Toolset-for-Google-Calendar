import React from 'react';
import { getItemFromCache } from '../lib/cache';
import { Event } from '../../interfaces/eventInterface';
import { JsxElementToHtmlElement, downloadStringAsFile } from '../lib/miscellaneous';

const exportToIcalPrepare = () => {
  const menuItem = Array.from(document.querySelectorAll('ul.VfPpkd-StrnGf-rymPhb.DMZ54e')).filter((ulElement) => {
    return (ulElement.parentNode as HTMLElement).hasAttribute('data-eventid');
  })[0];

  let exportToIcalMenuItem = document.querySelector('#exportToIcalMenuItem');
  if (exportToIcalMenuItem || !menuItem) {
    return;
  }
  exportToIcalMenuItem = JsxElementToHtmlElement(
    <li id="exportToIcalMenuItem" className="OwNvm taKRZe VfPpkd-StrnGf-rymPhb-ibnC6b" role="menuitem" tabIndex={-1}>
      <span className="VfPpkd-StrnGf-rymPhb-pZXsl"></span>
      <span className="VfPpkd-StrnGf-rymPhb-b9t22c">Export to iCal</span>
    </li>,
  );
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

  const eventStorage: Event[] | [] = getItemFromCache('eventStorage') || [];
  const activeEvent = eventStorage.find((event) => event.parentElement?.getAttribute('data-eventid') === activeEventId);
  if (!activeEvent) return;
  /* https://datatracker.ietf.org/doc/html/rfc5545 */
  const icalString = `BEGIN:VCALENDAR\r\n
VERSION:2.0\r\n
PRODID:-//Google Inc//Google Calendar 70.9054//EN\r\n
CALSCALE:GREGORIAN\r\n
BEGIN:VTIMEZONE\r\n
TZID:UTC\r\n
BEGIN:DAYLIGHT\r\n
TZOFFSETFROM:+0000\r\n
TZOFFSETTO:+0000\r\n
TZNAME:Daylight Saving Time\r\n
DTSTART:19700329T020000\r\n
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\n
END:DAYLIGHT\r\n
BEGIN:STANDARD\r\n
TZOFFSETFROM:+0000\r\n
TZOFFSETTO:+0000\r\n
TZNAME:Standard Time\r\n
DTSTART:19701101T030000\r\n
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\n
END:STANDARD\r\n
END:VTIMEZONE\r\n
BEGIN:VEVENT\r\n
UID:${activeEvent.id}@google.com\r\n
DTSTAMP;TZID=UTC:${formatDateToIcal(new Date())}\r\n
DTSTART;TZID=UTC:${formatDateToIcal(activeEvent.dates.start)}\r\n
DTEND;TZID=UTC:${formatDateToIcal(activeEvent.dates.end)}\r\n
DESCRIPTION:${activeEvent.description ?? ''}\r\n
LOCATION:${activeEvent.location ?? ''}\r\n
${activeEvent.recurrenceRule ? `RRULE:${activeEvent.recurrenceRule}\r\n` : ''}\
SUMMARY:${activeEvent.name}\r\n
END:VEVENT\r\n
END:VCALENDAR`;
  // only keep: letters, numbers, spaces, dots, dashes
  downloadStringAsFile(icalString, activeEvent.name.replace(/[^\w\s\.-\d]/g, '-') + '.ics');
};

function formatDateToIcal(date: Date) {
  return date.toISOString().replace(/[-:.]/g, '').slice(0, -4);
}

export { exportToIcalPrepare };
/* 
other properties, maybe interesting in the future:
TRANSP:OPAQUE https://www.kanzaki.com/docs/ical/transp.html This property defines whether an event is transparent or not to busy time searches.
*/
