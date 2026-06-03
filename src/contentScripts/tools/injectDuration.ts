import { CalEvent } from '../../interfaces/eventInterface';
import { Settings } from '../../interfaces/SettingsInterface';
import { logging } from '../lib/logger';

function injectDuration(calEvent: CalEvent, settings: Settings) {
  if (calEvent.type === 'allDay' && settings.calcDuration_disableForAllDayEvents) {
    const eventTimeElement = calEvent.timeElement!;
    if (!eventTimeElement) return;
    const parentElement = eventTimeElement.parentElement!;
    if (!parentElement) return;
    let oldDurationElement = parentElement.querySelector('.event-duration') as HTMLElement | null;
    if (oldDurationElement) {
      oldDurationElement.remove();
    }
    return;
  }

  if (calEvent.durationFormated) {
    try {
      const eventTimeElement = calEvent.timeElement!;
      const parentElement = eventTimeElement.parentElement!;
      const isMultiDayEvent = calEvent.type === 'allDay' || calEvent.type === 'nonAllDayMultiDay';
      const sourceDurationElement = isMultiDayEvent ? eventTimeElement.querySelector('.nHqeVd') : eventTimeElement;
      let durationElement: HTMLElement;
      if (isMultiDayEvent) {
        durationElement = sourceDurationElement!.cloneNode(true) as HTMLElement;
      } else {
        durationElement = eventTimeElement.cloneNode(true) as HTMLElement;
        durationElement.classList.remove('gVNoLb');
      }
      durationElement.classList.add('event-duration');

      let oldDurationElement = parentElement.querySelector('.event-duration') as HTMLElement | null;
      let position = getPosition(parentElement, oldDurationElement, calEvent);

      // if new position does not match old position, remove old duration element
      if (oldDurationElement && oldDurationElement.getAttribute('position') !== position) {
        oldDurationElement.remove();
        oldDurationElement = null;
      }

      if (position === 'inline-block') {
        // durationelement next to time
        const durationText = `(${calEvent.durationFormated})`;
        if (!oldDurationElement) {
          logging('info', 'injectDuration-T1: adding duration: ', calEvent.id, calEvent.name, ' duration: ', calEvent.durationFormated);
          if (!isMultiDayEvent) {
            eventTimeElement.style.display = 'inline-block';
          }
          durationElement.style.display = 'inline-block';
          durationElement.style.paddingLeft = '5px';
          durationElement.innerText = durationText;
        } else {
          if ((oldDurationElement as HTMLElement).innerText !== durationText) {
            // update duration
            logging(
              'info',
              ' injectDuration-T1: updating duration: ',
              calEvent.id,
              calEvent.name,
              ' duration: ',
              calEvent.durationFormated,
            );
            (oldDurationElement as HTMLElement).innerText = durationText;
          }
        }
        // else nothing to do, because the duration element is already in the right position
      } else {
        // durationelement below time
        if (!oldDurationElement) {
          logging('info', 'injectDuration-T2: adding duration: ', calEvent.id, calEvent.name, ' duration: ', calEvent.durationFormated);
          eventTimeElement.style.display = 'block';
          durationElement.innerText = calEvent.durationFormated;
        } else if ((oldDurationElement as HTMLElement).innerText != calEvent.durationFormated) {
          // update duration
          logging('info', 'injectDuration-T2: updating duration: ', calEvent.id, calEvent.name, ' duration: ', calEvent.durationFormated);
          (oldDurationElement as HTMLElement).innerText = calEvent.durationFormated;
        }
      }

      if (!oldDurationElement) {
        // save new position of duration element
        durationElement.setAttribute('position', position);
        // insert durationElement after eventTimeElement
        if (isMultiDayEvent) {
          sourceDurationElement!.parentElement!.append(durationElement);
        } else {
          eventTimeElement.after(durationElement);
        }
      }

      // adjust styling
      if (parentElement.style.whiteSpace !== 'nowrap') parentElement.style.whiteSpace = 'nowrap';
    } catch (error) {
      logging('error', 'injectDurration: ', error);
      return;
    }
  }
}

/* sum up height of eventTimeElement and all siblings of  eventTimeElement */
function getHeight(element: HTMLElement) {
  let height = 0;
  const siblings = element.children;
  for (let i = 0; i < siblings.length; i++) {
    height += (siblings[i] as HTMLElement).clientHeight;
  }
  return height;
}

function getPosition(eventContainer: HTMLElement, oldDurationElement: HTMLElement | null, eventObject: CalEvent) {
  if (eventObject.type == 'allDay' || eventObject.type == 'nonAllDayMultiDay') {
    return 'inline-block';
  }

  let position = 'block';
  /* height that the  Calendar Event element needs to have to  not be Inline*/
  let maxHeightForInlineBlock = getHeight(eventContainer) + 15; //15px is the height of the duration element

  if (oldDurationElement) {
    maxHeightForInlineBlock -= 15; /// remvoe old duration element height, because it is already in the eventTimeElement
    if (oldDurationElement.getAttribute('position') == 'inline-block') maxHeightForInlineBlock += 10; // add 10 to reduce amount of position changes
  }

  // if the heigt of the Calendar Event element is smaller than the maxHeightForInlineBlock or type is small
  if (eventObject.parentElement!.clientHeight < maxHeightForInlineBlock || eventObject.type == 'short') position = 'inline-block';
  return position;
}

export { injectDuration };
