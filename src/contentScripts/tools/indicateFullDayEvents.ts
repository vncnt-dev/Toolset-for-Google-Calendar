import { getDateFromDateKey, isBetweenDates, isBetweenDays, isSameDay } from '../lib/miscellaneous';
import { Event } from '../../interfaces/eventInterface';
import { settings } from '../lib/SettingsHandler';
import { getItemFromCache, setItemInCache } from '../lib/cache';

const daysMaxTransparency = 30;
const daysMinTransparency = 1;

var indicateFullDayEvents = (eventStorageMultiDay: Event[]) => {
  if (eventStorageMultiDay.length === 0) return;
  // heigt of 1h based on sidebar timeline elements
  setItemInCache('baseHeight', (document.querySelector('.s4ZaLd')! as HTMLElement).offsetHeight);
  setItemInCache('maxTransparency', settings.indicateFullDayEvents_maxTransparency);
  setItemInCache('minTransparency', settings.indicateFullDayEvents_minTransparency);

  const dateColumnElements = Array.from(document.querySelectorAll('.YvjgZe'));
  try {
    for (const changedEvent of eventStorageMultiDay) {
      const id = generateID(changedEvent);
      if (document.getElementById(id)) continue; // indicator element already exists
      for (const DateColumnElement of dateColumnElements) {
        const DateOfDateColumnElement = getDateFromDateKey(parseInt(DateColumnElement.getAttribute('data-datekey')!));
        // if event is on current calDate, proceed
        if (isBetweenDays(changedEvent.eventTime[0], changedEvent.eventTime[1], DateOfDateColumnElement)) {
          const indicatorElement = document.createElement('div');
          indicatorElement.id = `${id}`;
          indicatorElement.classList.add('fullDayEventIndicator', 'EfQccc');
          indicatorElement.style.backgroundColor = `${changedEvent.eventTimeElement!.style.backgroundColor}`;
          indicatorElement.style.opacity = `${calculateOpacity(changedEvent)}`;
          indicatorElement.style.zIndex = `3`; // above calendar lines below other events
          indicatorElement.style.top = `${calculateTop(changedEvent, DateOfDateColumnElement)}px`;
          indicatorElement.style.height = `${calculateHeight(changedEvent, DateOfDateColumnElement)}px`;
          calculateWidthAndPos(changedEvent, eventStorageMultiDay, DateOfDateColumnElement, indicatorElement);

          const eventContainer = DateColumnElement.querySelector('div.WJVfWe.A3o4Oe');
          if (eventContainer) {
            eventContainer.appendChild(indicatorElement);
          }
        }
      }
    }
  } catch (error) {
    console.error('indicateFullDayEvents: ', error);
  }
};

/** generates ID for indicator element */
var generateID = function (event: Event) {
  let rawID = JSON.stringify([event.eventTime, event.eventTimeElement!.style.backgroundColor, event.eventName]);
  // prevent problems with whitespaces etc., max 65. characters
  return 'ID' + encodeURIComponent(rawID).replace(/%/g, '_').slice(0, 65);
};

/** generate opacity for event, based on duration */
var calculateOpacity = function (event: Event) {
  const durationInDays = event.duration / 60 / 24;
  const maxTransparency: number = getItemFromCache('maxTransparency');
  const minTransparency: number = getItemFromCache('minTransparency');

  let transparency;
  if (durationInDays > daysMaxTransparency) {
    transparency = maxTransparency;
  } else if (durationInDays < daysMinTransparency) {
    transparency = minTransparency;
  } else {
    const durationRatio = (durationInDays - daysMinTransparency) / (daysMaxTransparency - daysMinTransparency);
    transparency = durationRatio * (maxTransparency - minTransparency) + minTransparency;
  }

  return 1 - transparency; // invert transparency to get opacity
};

var calculateTop = function (event: Event, calDate: Date) {
  let baseHeight: number = getItemFromCache('baseHeight');
  // if calDate is start date of event, return height based on start time
  if (isSameDay(calDate, event.eventTime[0])) {
    return baseHeight * (event.eventTime[0].getHours() + event.eventTime[0].getMinutes() / 60);
  } else {
    return 0;
  }
};

var calculateHeight = function (event: Event, calDate: Date) {
  let baseHeight: number = getItemFromCache('baseHeight');
  // if calDate is neither start nor end date of event, return full height
  if (!isSameDay(calDate, event.eventTime[0]) && !isSameDay(calDate, event.eventTime[1])) return baseHeight * 24;
  // if calDate is start date of event, height is 24h - start time
  else if (isSameDay(calDate, event.eventTime[0])) return baseHeight * (24 - (event.eventTime[0].getHours() + event.eventTime[0].getMinutes() / 60));
  // if calDate is end date of event, height is end time
  else if (isSameDay(calDate, event.eventTime[1])) return baseHeight * (event.eventTime[1].getHours() + event.eventTime[1].getMinutes() / 60);
  else {
    return 0;
  }
};

var calculateWidthAndPos = function (
  event: Event,
  eventStorageMultiDay: Event[],
  DateOfDateColumnElement: Date,
  indicatorElement: HTMLDivElement,
): HTMLDivElement {
  // get count of parrallel multi-day-events on same day
  let parrallelEvents = eventStorageMultiDay.filter(function (eventInStorage) {
    if (
      isBetweenDays(eventInStorage.eventTime[0], eventInStorage.eventTime[1], DateOfDateColumnElement) && // event is on current calDate
      // it posible that an event is on the same day as the current event, but not parrallel ->
      (isBetweenDates(eventInStorage.eventTime[0], eventInStorage.eventTime[1], event.eventTime[0]) || // starts during other event
        isBetweenDates(eventInStorage.eventTime[0], eventInStorage.eventTime[1], event.eventTime[1])) // ends during other event
    )
      return eventInStorage;
  });

  let indexOfCurrentEvent = parrallelEvents.findIndex(function (eventInStorage) {
    return eventInStorage.id === event.id;
  });

  let width = settings.indicateFullDayEvents_maxWidth / parrallelEvents.length;
  indicatorElement.style.width = width + '%';
  indicatorElement.style.left = width * indexOfCurrentEvent + '%';
  return indicatorElement;
};

export { indicateFullDayEvents };
