import { Event } from '../../interfaces/EventInterface';
import { isSameDate } from '../lib/miscellaneous';
import { settings } from '../lib/SettingsHandler';

function addHoverOverInformation(event: Event) {
  let innerText = formatTime(event.eventTime);
  if (event.durationFormated) innerText += ' (' + event.durationFormated + ')';
  innerText += '\n' + event.eventName;

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
          hoverInformationElement.style.top = event.clientY - hoverInformationElement.clientHeight + 10 + 'px';
        } else {
          hoverInformationElement.style.top = event.clientY - 10 + 'px';
        }
        hoverInformationElement.style.left = event.clientX + 'px';
      }
    })(innerText),
  );

  // hoverout eventlistener
  event.parentElement!.addEventListener('mouseout', (event) => {
    document.getElementById('hoverInformationElement')!.style.visibility = 'hidden';
  });
}

function formatTime(eventTime: Date[]): string {
  // { year: 'numeric', month: '2-digit', day: '2-digit' ,hour:'2-digit',minute: '2-digit'};
  if (isSameDate(eventTime[0], eventTime[1])) {
    return (
      zeroPad(eventTime[0].getHours(), 2) +
      ':' +
      zeroPad(eventTime[0].getMinutes(), 2) +
      ' - ' +
      zeroPad(eventTime[1].getHours(), 2) +
      ':' +
      zeroPad(eventTime[1].getMinutes(), 2))
  } else {
    let options: Intl.DateTimeFormatOptions
    let formattedTime = '';
    // only add time if event doesn't start 00:00
    if (!(eventTime[0].getHours() === 0 && eventTime[0].getMinutes() === 0))
      options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    else options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    formattedTime = eventTime[0].toLocaleDateString(undefined, options) + ' - ';
    if (!(eventTime[1].getHours() === 23 && eventTime[1].getMinutes() === 59))
      options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    else options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    formattedTime += eventTime[0].toLocaleDateString(undefined, options);
    return formattedTime;
  }
}

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');

export { addHoverOverInformation };
