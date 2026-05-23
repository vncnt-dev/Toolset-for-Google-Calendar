import { get } from 'http';
import { CalEvent, EventDates } from '../../interfaces/eventInterface';
import { isSameDay } from '../lib/miscellaneous';
import { getSettingsSnapshot } from '../lib/SettingsHandler';

function addHoverOverInformation(event: CalEvent) {
  if (!event.parentElement) return;

  if (event.parentElement.dataset.gctHoverBound === 'true') return;
  event.parentElement.dataset.gctHoverBound = 'true';

  let innerText = formatTime(event);
  if (event.durationFormated) innerText += ` (${event.durationFormated})`;
  if (event.name) innerText += `\n${event.name}`;
  if (event.location) innerText += `\n${event.location}`;
  if (event.description) innerText += `\n\n${event.description}`;

  const hoverInformationElement = document.getElementById('hoverInformationElement');
  const hoverInformationElementText = document.getElementById('hoverInformationElementText');
  if (!hoverInformationElement || !hoverInformationElementText) return;

  // set position and content of hoverInformationElement
  event.parentElement.addEventListener('mousemove', (mouseEvent) => {
    if (!getSettingsSnapshot().hoverInformation_isActive) {
      hoverInformationElement.style.visibility = 'hidden';
      return;
    }

    hoverInformationElementText.innerText = innerText;
    hoverInformationElement.style.visibility = 'visible';
    // position hoverInformationElement under mouse pointer
    // if mouse in near the bottom of the screen, move it up
    if (mouseEvent.clientY + hoverInformationElement.clientHeight > window.innerHeight) {
      hoverInformationElement.style.top = `${mouseEvent.clientY - hoverInformationElement.clientHeight + 10}px`;
    } else {
      hoverInformationElement.style.top = `${mouseEvent.clientY - 10}px`;
    }
    hoverInformationElement.style.left = `${mouseEvent.clientX}px`;
  });

  // hoverout eventlistener
  event.parentElement.addEventListener('mouseout', () => {
    hoverInformationElement.style.visibility = 'hidden';
  });
}

function formatTime(event: CalEvent): string {
  let eventTimes = event.dates;
  let lang: Intl.LocalesArgument = document.documentElement.lang;

  if (isSameDay(eventTimes.start, eventTimes.end)) {
    if (event.type === 'allDay') {
      let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return eventTimes.start.getJsDateObject().toLocaleDateString(lang, options);
    }

    const timeFormatter = new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const startTime = timeFormatter.format(eventTimes.start.getJsDateObject());
    const endTime = timeFormatter.format(eventTimes.end.getJsDateObject());

    return `${startTime} - ${endTime}`;
  } else {
    let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (event.type !== 'allDay') options = { ...options, hour: '2-digit', minute: '2-digit' };

    return (
      eventTimes.start.getJsDateObject().toLocaleDateString(lang, options) +
      ' - ' +
      eventTimes.end.getJsDateObject().toLocaleDateString(lang, options)
    );
  }
}

export { addHoverOverInformation };
