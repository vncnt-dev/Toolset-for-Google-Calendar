import { Event, EventDates } from '../../interfaces/eventInterface';
import { isSameDay } from '../lib/miscellaneous';
import { loadSettings } from '../lib/SettingsHandler';

function addHoverOverInformation(event: Event) {
  let innerText = formatTime(event.dates);
  if (event.durationFormated) innerText += ` (${event.durationFormated})`;
  if (event.name) innerText += `\n${event.name}`;
  if (event.location) innerText += `\n${event.location}`;

  // set position and content of hoverInformationElement
  event.parentElement!.addEventListener('mousemove',(event) =>
    ( async (innerText) => {
      let settings = await loadSettings();
      if (settings.hoverInformation_isActive) {
        document.getElementById('hoverInformationElementText')!.innerText = innerText;
        let hoverInformationElement = document.getElementById('hoverInformationElement')!;
        hoverInformationElement.style.visibility = 'visible';
        // position hoverInformationElement under mouse pointer
        // if mouse in near the buttom of the screen, move it up
        if (event.clientY + hoverInformationElement.clientHeight > window.innerHeight) {
          hoverInformationElement.style.top = `${event.clientY - hoverInformationElement.clientHeight + 10}px`;
        } else {
          hoverInformationElement.style.top = `${event.clientY - 10}px`;
        }
        hoverInformationElement.style.left = `${event.clientX}px`;
      }
    })(innerText),
  );

  // hoverout eventlistener
  event.parentElement!.addEventListener('mouseout', (event) => {
    document.getElementById('hoverInformationElement')!.style.visibility = 'hidden';
  });
}

function formatTime(eventTime: EventDates): string {
  if (isSameDay(eventTime.start, eventTime.end)) {
    return (
      eventTime.start.getHours().toString().padStart(2, '0') +
      ':' +
      eventTime.start.getMinutes().toString().padStart(2, '0') +
      ' - ' +
      eventTime.end.getHours().toString().padStart(2, '0') +
      ':' +
      eventTime.end.getMinutes().toString().padStart(2, '0')
    );
  } else {
    let options: Intl.DateTimeFormatOptions;
    let locales = document.documentElement.lang as Intl.LocalesArgument;
    let formattedTime = '';

    // only add time if not full day event
    let isFulldayEvent =
      eventTime.start.getHours() + eventTime.start.getTimezoneOffset() / 60 == 0 &&
      eventTime.start.getMinutes() == 0 &&
      eventTime.end.getHours() + eventTime.end.getTimezoneOffset() / 60 == 0 &&
      eventTime.end.getMinutes() == 0;

    if (!isFulldayEvent) options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    else options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    formattedTime = eventTime.start.toLocaleDateString(locales, options) + ' - ';

    if (!isFulldayEvent) options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    else options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    formattedTime += eventTime.end.toLocaleDateString(locales, options);

    return formattedTime;
  }
}

export { addHoverOverInformation };
