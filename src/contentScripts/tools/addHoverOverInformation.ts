import { Event } from '../../interfaces/eventInterface';
import { isSameDay } from '../lib/miscellaneous';
import { settings } from '../lib/SettingsHandler';

function addHoverOverInformation(event: Event) {
  let innerText = formatTime(event.eventTime);
  if (event.durationFormated) innerText += ` (${event.durationFormated})`;
  if (event.eventName) innerText += `\n${event.eventName}`;
  if (event.eventLocation) innerText += `\n${event.eventLocation}`;

  // set position and content of hoverInformationElement
  event.parentElement!.addEventListener('mousemove', (event) =>
    ((innerText) => {
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

function formatTime(eventTime: Date[]): string {
  if (isSameDay(eventTime[0], eventTime[1])) {
    return (
      eventTime[0].getHours().toString().padStart(2, '0') +
      ':' +
      eventTime[0].getMinutes().toString().padStart(2, '0') +
      ' - ' +
      eventTime[1].getHours().toString().padStart(2, '0') +
      ':' +
      eventTime[1].getMinutes().toString().padStart(2, '0')
    );
  } else {
    let options: Intl.DateTimeFormatOptions;
    let locales = document.documentElement.lang as Intl.LocalesArgument;
    let formattedTime = '';

    // only add time if not full day event
    let isFulldayEvent =
      eventTime[0].getHours() + eventTime[0].getTimezoneOffset() / 60 == 0 &&
      eventTime[0].getMinutes() == 0 &&
      eventTime[1].getHours() + eventTime[1].getTimezoneOffset() / 60 == 0 &&
      eventTime[1].getMinutes() == 0;

    if (!isFulldayEvent) options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    else options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    formattedTime = eventTime[0].toLocaleDateString(locales, options) + ' - ';

    if (!isFulldayEvent) options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    else options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    formattedTime += eventTime[1].toLocaleDateString(locales, options);

    return formattedTime;
  }
}

export { addHoverOverInformation };
