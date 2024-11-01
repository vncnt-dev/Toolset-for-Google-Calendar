import { get } from 'http';
import { CalEvent, EventDates } from '../../interfaces/eventInterface';
import { isSameDay } from '../lib/miscellaneous';
import { loadSettings } from '../lib/SettingsHandler';
import { getItemFromCache } from '../lib/sessionCache';

function addHoverOverInformation(event: CalEvent) {
  let innerText = formatTime(event);
  if (event.durationFormated) innerText += ` (${event.durationFormated})`;
  if (event.name) innerText += `\n${event.name}`;
  if (event.location) innerText += `\n${event.location}`;

  // set position and content of hoverInformationElement
  event.parentElement!.addEventListener('mousemove', (event) =>
    (async (innerText) => {
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

function formatTime(event: CalEvent): string {
  let eventTimes = event.dates;
  let timeZone = getItemFromCache('userInfo')?.timezone ?? new Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (isSameDay(eventTimes.start, eventTimes.end)) {
    const timeFormatter = new Intl.DateTimeFormat('default', {
      timeZone: timeZone,
      hour: '2-digit',
      minute: '2-digit',
    });

    const startTime = timeFormatter.format(eventTimes.start);
    const endTime = timeFormatter.format(eventTimes.end);

    return `${startTime} - ${endTime}`;
  } else {
    let lang: Intl.LocalesArgument = document.documentElement.lang;
    let options: Intl.DateTimeFormatOptions = {timeZone: timeZone,year: 'numeric', month: '2-digit', day: '2-digit' };
    if (event.type !== 'allDay') options = { ...options, hour: '2-digit', minute: '2-digit' };

    return eventTimes.start.toLocaleDateString(lang, options) + ' - ' + eventTimes.end.toLocaleDateString(lang, options);
  }
}

export { addHoverOverInformation };
