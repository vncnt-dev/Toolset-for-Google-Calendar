import { getDate, isBetweenDates, isSameDate } from '../lib/miscellaneous';
import { Event } from '../../interfaces/EventInterface';

var indicateFullDayEvents = function (eventStorageMultiDay: Event[]) {
  try {
    eventStorageMultiDay.forEach(function (changedEvent) {
      let id = generateID(changedEvent);
      if (document.getElementById(id)) return; // indicator element already exists
      /** all days (HTML-Columns) on current view, as array */
      Array.from(document.querySelectorAll('.YvjgZe')).forEach(function (DateColumnElement) {
        // get date of DateColumnElement
        let DateOfDateColumnElement = getDate(parseInt(DateColumnElement.getAttribute('data-datekey')!));
        // if event is on current calDate, proceed
        if (isBetweenDates(changedEvent.eventTime[0], changedEvent.eventTime[1], DateOfDateColumnElement)) {
          let indicatorElement = document.createElement('div');
          indicatorElement.id = id;
          indicatorElement.classList.add('fullDayEventIndicator', 'EfQccc');
          indicatorElement.style.backgroundColor = changedEvent.eventTimeElement.style.backgroundColor;
          indicatorElement.style.opacity = calculateOpacity(changedEvent).toString();
          indicatorElement.style.width = '100%';
          indicatorElement.style.zIndex = '3'; // above calendar lines below other events
          indicatorElement.style.top = calculateTop(changedEvent, DateOfDateColumnElement) + 'px';
          indicatorElement.style.height = calculateHeight(changedEvent, DateOfDateColumnElement) + 'px';

          DateColumnElement.querySelector('div.WJVfWe.A3o4Oe')!.appendChild(indicatorElement);
        }
      });
    });
  } catch (error) {
    console.error('indicateFullDayEvents: ', error);
  }
};

/** generates ID for indicator element */
var generateID = function (event: Event) {
  let rawID = JSON.stringify([event.eventTime, event.eventTimeElement.style.backgroundColor, event.eventName]);
  // prevent problems with whitespaces etc., max 65.
  return 'ID' + encodeURIComponent(rawID).replace(/%/g, '_');
};

/** generate opacity for event, based on duration */
var calculateOpacity = function (event: Event) {
  let duration = Math.round(event.duration / 60 / 24);
  let transparency = 0;
  let maxTransparencyAt = 30; // 30 days
  let minTransparencyAt = 1;
  let maxTransparency = 0.9;
  let minTransparency = 0.5;

  // generate transparency based on duration
  if (duration > maxTransparencyAt) {
    transparency = maxTransparency;
  } else if (duration < minTransparencyAt) {
    transparency = minTransparency;
  } else {
    transparency = ((duration - minTransparencyAt) / (maxTransparencyAt - minTransparencyAt)) * (maxTransparency - minTransparency) + minTransparency;
  }
  return 1 - transparency; // invert transparency to get opacity
};

var calculateTop = function (event: Event, calDate: Date) {
  // heigt of 1h based on sidebar timeline elements
  let baseHeight: number = (document.querySelector('.s4ZaLd')! as HTMLElement).offsetHeight;
  // if calDate is start date of event, return height based on start time
  if (isSameDate(calDate, event.eventTime[0])) {
    return baseHeight * (event.eventTime[0].getHours() + event.eventTime[0].getMinutes() / 60);
  } else {
    // else top is 0
    return 0;
  }
};

var calculateHeight = function (event: Event, calDate: Date) {
  // heigt of 1h based on sidebar timeline elements
  let baseHeight: number = (document.querySelector('.s4ZaLd')! as HTMLElement).offsetHeight;
  // if calDate is neither start nor end date of event, return full height
  if (!isSameDate(calDate, event.eventTime[0]) && !isSameDate(calDate, event.eventTime[1])) return baseHeight * 24;
  // if calDate is start date of event, height is 24h - start time
  else if (isSameDate(calDate, event.eventTime[0])) return baseHeight * (24 - (event.eventTime[0].getHours() + event.eventTime[0].getMinutes() / 60));
  // if calDate is end date of event, height is end time
  else if (isSameDate(calDate, event.eventTime[1])) return baseHeight * (event.eventTime[1].getHours() + event.eventTime[1].getMinutes() / 60);
  else {
    return 0;
  }
};

export { indicateFullDayEvents };
