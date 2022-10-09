import { Event } from '../../interfaces/eventInterface';

function injectDuration(eventObject: Event) {
  if (eventObject.durationFormated) {
    try {
      let eventTimeElement = eventObject.eventTimeElement!;
      let durationElement: HTMLElement;
      if (eventObject.type === 'multiDay') {
        durationElement = eventTimeElement.querySelector('.yzifAd')!.cloneNode(true) as HTMLElement;
      } else {
        durationElement = eventTimeElement.cloneNode(true) as HTMLElement;
        durationElement.classList.remove('gVNoLb');
      }
      durationElement.classList.add('event-duration');

      let oldDurationElement = eventTimeElement.parentElement!.querySelector('.event-duration');
      let position = getPosition(eventTimeElement, oldDurationElement as HTMLElement, eventObject);

      // if new position does not match old position, remove old duration element
      if (oldDurationElement && oldDurationElement.getAttribute('position') != position) {
        oldDurationElement.remove();
        oldDurationElement = null;
      }

      if (position == 'inline-block') {
        // durationelement next to time
        if (!oldDurationElement) {
          if (eventObject.type != 'multiDay') eventTimeElement.style.display = 'inline-block';
          durationElement.style.display = 'inline-block';
          durationElement.style.paddingLeft = '5px';
          durationElement.innerText = '(' + eventObject.durationFormated + ')';
        } else if ((oldDurationElement as HTMLElement).innerText != '(' + eventObject.durationFormated + ')') {
          // update duration
          (oldDurationElement as HTMLElement).innerText = '(' + eventObject.durationFormated + ')';
        }
        // else nothing to do, because the duration element is already in the right position
      } else {
        // durationelement below time
        if (!oldDurationElement) {
          eventTimeElement.style.display = 'block';
          durationElement.innerText = eventObject.durationFormated;
        } else if ((oldDurationElement as HTMLElement).innerText != eventObject.durationFormated) {
          // update duration
          (oldDurationElement as HTMLElement).innerText = eventObject.durationFormated;
        }
      }

      if (!oldDurationElement) {
        // save new position of duration element
        durationElement.setAttribute('position', position);
        // insert durationElement after eventTimeElement
        if (eventObject.type === 'multiDay') {
          eventTimeElement.querySelector('.yzifAd')!.parentElement!.append(durationElement);
        } else {
          eventTimeElement.after(durationElement);
        }
      }

      // adjust styling
      if (eventObject.parentElement!.style.whiteSpace != 'nowrap') eventObject.parentElement!.style.whiteSpace = 'nowrap';
    } catch (error) {
      console.warn('GC Tools - injectDurration: ', error);
      return;
    }
  }
}

/* sum up height of eventTimeElement and all siblings of  eventTimeElement */
function getHeight(element: HTMLElement) {
  let height = 0;
  let siblings = element.parentElement!.children;
  for (let i = 0; i < siblings.length; i++) {
    height += siblings[i].clientHeight;
  }
  return height;
}

function getPosition(eventTimeElement: HTMLElement, oldDurationElement: HTMLElement, eventObject: Event) {
  if (eventObject.type === 'multiDay') {
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
