import { Event } from '../../interfaces/EventInterface';
import { isSameDate } from '../lib/miscellaneous';
import { settings } from '../lib/SettingsHandler';

function addHoverOverInformation(event: Event) {
  let innerText = formatTime(event.eventTime);
  if (event.durationFormated) innerText += ' (' + event.durationFormated + ')';
  innerText += '\n' + event.eventName;

  // set position and content of hoverInformationElement
  event.parentElement.addEventListener('mousemove', (event) =>
    ((innerText) => {
      if (settings.hoverInformation_isActive) {
        document.getElementById('hoverInformationElementText')!.innerText = innerText;
        let hoverInformationElement = document.getElementById('hoverInformationElement')!;
        hoverInformationElement.style.visibility = 'visible';
        // position hoverInformationElement under mouse pointer
        // if mouse in near the buttom of the screen, move it up
        if (event.clientY + hoverInformationElement.clientHeight > window.innerHeight) {
          hoverInformationElement.style.top = event.clientY - hoverInformationElement.clientHeight + 10 + 'px';
        } else {
          hoverInformationElement.style.top = event.clientY - 10 + 'px';
        }
        hoverInformationElement.style.left = event.clientX + 'px';
      }
    })(innerText),
  );

  // hoverout eventlistener
  event.parentElement.addEventListener('mouseout', (event) => {
    document.getElementById('hoverInformationElement')!.style.visibility = 'hidden';
  });
}

function formatTime(eventTime: Date[]): string {
  let formattedTime = '';
  if (isSameDate(eventTime[0], eventTime[1])) {
    formattedTime = eventTime[0].getHours() + ':' + eventTime[0].getMinutes() + ' - ' + eventTime[1].getHours() + ':' + eventTime[1].getMinutes();
  } else {
    if (!(eventTime[0].getHours() === 0 && eventTime[0].getMinutes() === 0))
      formattedTime = eventTime[0].getHours() + ':' + eventTime[0].getMinutes();
    formattedTime += eventTime[0].getDate().toString();
    if (eventTime[0].getMonth() !== eventTime[1].getMonth() || eventTime[0].getFullYear() !== eventTime[1].getFullYear())
      formattedTime += '.' + eventTime[0].getMonth().toString();
    if (eventTime[0].getFullYear() !== eventTime[1].getFullYear()) formattedTime += '.' + eventTime[0].getFullYear().toString();

    formattedTime += ' - ';
    if (!(eventTime[1].getHours() === 23 && eventTime[1].getMinutes() === 59))
      formattedTime += eventTime[1].getHours() + ':' + eventTime[1].getMinutes();
    formattedTime += eventTime[1].getDate() + '.' + eventTime[1].getMonth() + '.' + eventTime[1].getFullYear();
  }
  return formattedTime;
}

export { addHoverOverInformation };
