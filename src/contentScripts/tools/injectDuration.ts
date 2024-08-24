import { CalEvent } from '../../interfaces/eventInterface';

function injectDuration(calEvent: CalEvent) {
  if (calEvent.durationFormated) {
    try {
      let eventTimeElement = calEvent.timeElement!;
      let durationElement: HTMLElement;
      if (calEvent.type === 'allDay' || calEvent.type === 'nonAllDayMultiDay') {
        durationElement = eventTimeElement.querySelector('.nHqeVd')!.cloneNode(true) as HTMLElement;
      } else {
        durationElement = eventTimeElement.cloneNode(true) as HTMLElement;
        durationElement.classList.remove('gVNoLb');
      }
      durationElement.classList.add('event-duration');

      let oldDurationElement = eventTimeElement.parentElement!.querySelector('.event-duration');
      let position = getPosition(eventTimeElement, oldDurationElement as HTMLElement, calEvent);

      // if new position does not match old position, remove old duration element
      if (oldDurationElement && oldDurationElement.getAttribute('position') !== position) {
        oldDurationElement.remove();
        oldDurationElement = null;
      }

      if (position === 'inline-block') {
        // durationelement next to time
        const durationText = `(${calEvent.durationFormated})`;
        if (!oldDurationElement) {
          if (calEvent.type !== 'allDay' && calEvent.type !== 'nonAllDayMultiDay') {
            eventTimeElement.style.display = 'inline-block';
          }
          durationElement.style.display = 'inline-block';
          durationElement.style.paddingLeft = '5px';
          durationElement.innerText = durationText;
        } else {
          if ((oldDurationElement as HTMLElement).innerText !== durationText) {
            // update duration
            (oldDurationElement as HTMLElement).innerText = durationText;
          }
        }
        // else nothing to do, because the duration element is already in the right position
      } else {
        // durationelement below time
        if (!oldDurationElement) {
          eventTimeElement.style.display = 'block';
          durationElement.innerText = calEvent.durationFormated;
        } else if ((oldDurationElement as HTMLElement).innerText != calEvent.durationFormated) {
          // update duration
          (oldDurationElement as HTMLElement).innerText = calEvent.durationFormated;
        }
      }

      if (!oldDurationElement) {
        // save new position of duration element
        durationElement.setAttribute('position', position);
        // insert durationElement after eventTimeElement
        if (calEvent.type == 'allDay' || calEvent.type == 'nonAllDayMultiDay') {
          eventTimeElement.querySelector('.nHqeVd')!.parentElement!.append(durationElement);
        } else {
          eventTimeElement.after(durationElement);
        }
      }

      // adjust styling
      if (calEvent.parentElement!.style.whiteSpace !== 'nowrap') {
        calEvent.parentElement!.style.whiteSpace = 'nowrap';
      }
    } catch (error) {
      console.warn('GC Tools - injectDurration: ', error);
      return;
    }
  }
}

/* sum up height of eventTimeElement and all siblings of  eventTimeElement */
function getHeight(element: HTMLElement) {
  let height = 0;
  const siblings = element.parentElement!.querySelectorAll(':scope > *');
  for (let i = 0; i < siblings.length; i++) {
    height += siblings[i].clientHeight;
  }
  return height;
}

function getPosition(eventTimeElement: HTMLElement, oldDurationElement: HTMLElement, eventObject: CalEvent) {
  if (eventObject.type == 'allDay' || eventObject.type == 'nonAllDayMultiDay') {
    return 'inline-block';
  }

  let position = 'block';
  /* height that the  Calendar Event element needs to have to  not be Inline*/
  let maxHeightForInlineBlock = getHeight(eventTimeElement) + 15; //15px is the height of the duration element

  if (oldDurationElement) {
    maxHeightForInlineBlock -= 15; /// remvoe old duration element height, because it is already in the eventTimeElement
    if (oldDurationElement.getAttribute('position') == 'inline-block') maxHeightForInlineBlock += 10; // add 10 to reduce amount of position changes
  }

  // if the heigt of the Calendar Event element is smaller than the maxHeightForInlineBlock or type is small
  if (eventObject.parentElement!.clientHeight < maxHeightForInlineBlock || eventObject.type == 'short') position = 'inline-block';
  return position;
}

export { injectDuration };
