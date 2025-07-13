import { CalEvent, EventDates } from '../../interfaces/eventInterface';
import { isSameDay } from '../lib/miscellaneous';
import { loadSettings } from '../lib/SettingsHandler';

function addHoverOverInformation(event: CalEvent) {
  let innerText = formatTime(event);
  if (event.durationFormated) innerText += ` (${event.durationFormated})`;
  if (event.name) innerText += `\n${event.name}`;
  if (event.location) innerText += `\n${event.location}`;
  if (event.description) innerText += `\n\n${event.description}`;

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

  if (isSameDay(eventTimes.start, eventTimes.end)) {
    let padTwo = (num: number) => num.toString().padStart(2, '0');
    return (
      padTwo(eventTimes.start.getHours()) +
      ':' +
      padTwo(eventTimes.start.getMinutes()) +
      ' - ' +
      padTwo(eventTimes.end.getHours()) +
      ':' +
      padTwo(eventTimes.end.getMinutes())
    );
  } else {
    let lang: Intl.LocalesArgument = document.documentElement.lang;
    let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (event.type !== 'allDay') options = { ...options, hour: '2-digit', minute: '2-digit' };

    return eventTimes.start.toLocaleDateString(lang, options) + ' - ' + eventTimes.end.toLocaleDateString(lang, options);
  }
}

export { addHoverOverInformation };
