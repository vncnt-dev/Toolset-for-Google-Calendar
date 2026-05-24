import React from 'react';
import { getItemFromCache } from '../lib/sessionCache';
import { CalEvent } from '../../interfaces/eventInterface';
import { JsxElementToHtmlElement, downloadStringAsFile, logging, sleep } from '../lib/miscellaneous';

const exportToIcalPrepare = async () => {
  await sleep(1000); // wait a bit to make sure the popup is  loaded
  logging('info', `Preparing export to iCal-pre check`);
  const popupView = document.getElementById('xDetDlg');
  if (!popupView) return;
  logging('info', 'Preparing export to iCal menu item');

  const menuItem = document.querySelector('div > div > ul[data-list-type][aria-label]');

  let exportToIcalMenuItem = document.querySelector('#exportToIcalMenuItem');
  if (exportToIcalMenuItem) return;
  if (!menuItem) {
    logging('warn', 'Could not find menu item container for export to iCal');
    return;
  }

  exportToIcalMenuItem = JsxElementToHtmlElement(
    <li
      id="exportToIcalMenuItem"
      role="menuitem"
      className="aqdrmf-rymPhb-ibnC6b aqdrmf-rymPhb-ibnC6b-OWXEXe-hXIJHe aqdrmf-rymPhb-ibnC6b-OWXEXe-SfQLQb-Woal0c-RWgCYc O68mGe-OQAXze-OWXEXe-SfQLQb-Woal0c-RWgCYc"
    >
      <span className="UTNHae"></span>
      <span className="dNKuRb aqdrmf-rymPhb-sNKcce"></span>
      <span className="aqdrmf-rymPhb-KkROqb"></span>
      <span className="aqdrmf-rymPhb-Gtdoyb">
        <span className="aqdrmf-rymPhb-fpDzbe-fmcmS">Export to iCal</span>
      </span>
      <span className="aqdrmf-rymPhb-JMEf7e"></span>
      <span className="O68mGe-xl07Ob-mQXhdd"></span>
    </li>,
  );
  exportToIcalMenuItem.addEventListener('click', () => {
    exportToIcal(popupView);
  });
  menuItem.appendChild(exportToIcalMenuItem);
};

const exportToIcal = (popupView: HTMLElement | null) => {
  if (!popupView) return;
  const activeEventId = popupView.getAttribute('data-eventid');
  if (!activeEventId) return;

  const eventStorage: CalEvent[] | [] = getItemFromCache('eventStorage') || [];
  const activeEvent = eventStorage.find((event) => event.parentElement?.getAttribute('data-eventid') === activeEventId);
  if (!activeEvent) return;
  /* https://datatracker.ietf.org/doc/html/rfc5545 */
  const icalString = `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//Google Inc//Google Calendar 70.9054//EN\r
CALSCALE:GREGORIAN\r
BEGIN:VTIMEZONE\r
TZID:UTC\r
BEGIN:DAYLIGHT\r
TZOFFSETFROM:+0000\r
TZOFFSETTO:+0000\r
TZNAME:Daylight Saving Time\r
DTSTART:19700329T020000\r
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r
END:DAYLIGHT\r
BEGIN:STANDARD\r
TZOFFSETFROM:+0000\r
TZOFFSETTO:+0000\r
TZNAME:Standard Time\r
DTSTART:19701101T030000\r
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r
END:STANDARD\r
END:VTIMEZONE\r
BEGIN:VEVENT\r
UID:${activeEvent.id}@google.com\r
DTSTAMP;TZID=UTC:${formatDateToIcal(new Date())}\r
DTSTART;TZID=UTC:${formatDateToIcal(activeEvent.dates.start.getOriginalJsDateObject())}\r
DTEND;TZID=UTC:${formatDateToIcal(activeEvent.dates.end.getOriginalJsDateObject())}\r
DESCRIPTION:${activeEvent.description ?? ''}\r
LOCATION:${activeEvent.location ?? ''}\r
${activeEvent.recurrenceRule ? `RRULE:${activeEvent.recurrenceRule}\r` : ''}\
SUMMARY:${activeEvent.name}\r
END:VEVENT\r
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
