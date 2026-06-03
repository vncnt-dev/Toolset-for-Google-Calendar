import { calculateHashSha256, getDateFromDateKey, isBetweenDateTimes, isBetweenDays, isSameDay } from '../lib/miscellaneous';
import { logging } from '../lib/logger';
import { CalEvent } from '../../interfaces/eventInterface';
import { Settings } from '../../interfaces/SettingsInterface';
import { getSettingsSnapshot } from '../lib/SettingsHandler';
import { getItemFromCache, setItemInCache } from '../lib/sessionCache';

import './indicateAllAndMultiDayEvents.css';
import { log } from 'console';

const daysMaxTransparency = 30;
const daysMinTransparency = 1;

var indicateAllDayEvents = async (eventStorageMultiDay: CalEvent[], settings: Settings = getSettingsSnapshot()) => {
  if (eventStorageMultiDay.length === 0) return;

  // Deduplicate events by ID so we don't process multiple HTML chunks for the same event
  eventStorageMultiDay = eventStorageMultiDay.filter((event, index, self) =>
    index === self.findIndex((e) => e.id === event.id)
  );

  // heigt of 1h based on sidebar timeline elements
  setItemInCache('baseHeight', (document.querySelector('.XsRa1c')! as HTMLElement).offsetHeight);
  setItemInCache('maxTransparency', settings.indicateAllDayEvents_maxTransparency);
  setItemInCache('minTransparency', settings.indicateAllDayEvents_minTransparency);

  const dateColumnElements = Array.from(document.querySelectorAll('.BiKU4b'));
  try {
    for (const DateColumnElement of dateColumnElements) {
      const DateOfDateColumnElement = getDateFromDateKey(parseInt(DateColumnElement.getAttribute('data-datekey')!));
      const eventsForDay = eventStorageMultiDay.filter((event) => isBetweenDays(event, DateOfDateColumnElement));

      for (const changedEvent of eventsForDay) {
        const id = await generateID(changedEvent, DateOfDateColumnElement);
        if (document.querySelector(`[gcaltoolsid="${id}"]`) !== null) continue; // indicator element already exists
        logging('info', 'indicateAllDayEvents: eventId', changedEvent.id, ' sha: ', id, ' event: ', JSON.stringify([changedEvent.dates, changedEvent.name]));

        const indicatorElement = document.createElement('div');
        indicatorElement.setAttribute('gcaltoolsid', id);
        indicatorElement.classList.add('allDayEventIndicator', 'EfQccc');
        indicatorElement.style.backgroundColor = `${changedEvent.timeElement!.style.backgroundColor}`;
        indicatorElement.style.opacity = `${calculateOpacity(changedEvent)}`;
        indicatorElement.style.top = `${calculateTop(changedEvent, DateOfDateColumnElement)}px`;
        indicatorElement.style.height = `${calculateHeight(changedEvent, DateOfDateColumnElement)}px`;
        calculateWidthAndPos(changedEvent, eventsForDay, DateOfDateColumnElement, indicatorElement, settings);

        const eventContainer = DateColumnElement.querySelector('div.feMFof.A3o4Oe');
        if (eventContainer) {
          eventContainer.appendChild(indicatorElement);
        }
      }
    }
  } catch (error) {
    logging('error', 'indicateAllDayEvents error: ', error);
  }
};

/** generates ID for indicator element */
var generateID = async function (event: CalEvent, columnDate: Date) {
  const rawID = JSON.stringify([event.dates, event.timeElement!.style.backgroundColor, event.name, columnDate.toISOString()]);
  return 'ID_' + (await calculateHashSha256(rawID));
};

/** generate opacity for event, based on duration */
var calculateOpacity = function (event: CalEvent) {
  const durationInDays = event.durationInMinutes / 60 / 24;
  const maxTransparency: number = getItemFromCache('maxTransparency')!;
  const minTransparency: number = getItemFromCache('minTransparency')!;

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

var calculateTop = function (event: CalEvent, calDate: Date) {
  let baseHeight: number = getItemFromCache('baseHeight')!;
  // if calDate is start date of event, return height based on start time
  if (isSameDay(calDate, event.dates.start)) {
    return baseHeight * (event.dates.start.getHours() + event.dates.start.getMinutes() / 60);
  } else {
    return 0;
  }
};

var calculateHeight = function (event: CalEvent, calDate: Date) {
  let baseHeight: number = getItemFromCache('baseHeight')!;
  // if calDate is neither start nor end date of event, return full height
  if (!isSameDay(calDate, event.dates.start) && !isSameDay(calDate, event.dates.end)) return baseHeight * 24;
  // if calDate is start date of event, height is 24h - start time
  else if (isSameDay(calDate, event.dates.start)) return baseHeight * (24 - (event.dates.start.getHours() + event.dates.start.getMinutes() / 60));
  // if calDate is end date of event, height is end time
  else if (isSameDay(calDate, event.dates.end)) return baseHeight * (event.dates.end.getHours() + event.dates.end.getMinutes() / 60);
  else {
    return 0;
  }
};

var calculateWidthAndPos = function (
  event: CalEvent,
  eventStorageMultiDay: CalEvent[],
  DateOfDateColumnElement: Date,
  indicatorElement: HTMLDivElement,
  settings: Settings,
): HTMLDivElement {
  // get count of parrallel multi-day/all-day events
  const parrallelEvents = eventStorageMultiDay.filter((eventInStorage) => {
    return (
      isBetweenDateTimes(eventInStorage.dates.start, eventInStorage.dates.end, event.dates.start) || // current event starts during eventInStorage
      isBetweenDateTimes(event.dates.start, event.dates.end, eventInStorage.dates.start) // eventInStorage starts during current event
    );
  });

  let indexOfCurrentEvent = parrallelEvents.findIndex((eventInStorage) => {
    return eventInStorage.id === event.id;
  });

  let width = settings.indicateAllDayEvents_maxWidth / parrallelEvents.length;
  indicatorElement.style.width = width + '%';
  indicatorElement.style.left = width * indexOfCurrentEvent + '%';
  return indicatorElement;
};

export { indicateAllDayEvents };
