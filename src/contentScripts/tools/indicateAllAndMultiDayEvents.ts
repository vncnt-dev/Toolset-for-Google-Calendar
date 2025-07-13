import { calculateHashSha256, getDateFromDateKey, isBetweenDateTimes, isBetweenDays, isSameDay } from '../lib/miscellaneous';
import { CalEvent } from '../../interfaces/eventInterface';
import { Settings } from '../../interfaces/SettingsInterface';
import { loadSettings } from '../lib/settingsHandler';
import { getItemFromCache, setItemInCache } from '../lib/sessionCache';

import './indicateAllAndMultiDayEvents.css';

const daysMaxTransparency = 30;
const daysMinTransparency = 1;

var indicateAllDayEvents = async (eventStorageMultiDay: CalEvent[]) => {
  let settings = await loadSettings();
  if (eventStorageMultiDay.length === 0) return;
  // heigt of 1h based on sidebar timeline elements
  setItemInCache('baseHeight', (document.querySelector('.XsRa1c')! as HTMLElement).offsetHeight);
  setItemInCache('maxTransparency', settings.indicateAllDayEvents_maxTransparency);
  setItemInCache('minTransparency', settings.indicateAllDayEvents_minTransparency);

  const dateColumnElements = Array.from(document.querySelectorAll('.BiKU4b'));
  try {
    for (const changedEvent of eventStorageMultiDay) {
      const id = await generateID(changedEvent);
      if (document.querySelector(`[gcaltoolsid="${id}"]`) !== null) continue; // indicator element already exists
      console.log('indicateAllDayEvents: id',changedEvent.id,' sha: ',id, ' event: ',JSON.stringify([changedEvent.dates, changedEvent.timeElement!.style.backgroundColor, changedEvent.name]));

      for (const DateColumnElement of dateColumnElements) {
        const DateOfDateColumnElement = getDateFromDateKey(parseInt(DateColumnElement.getAttribute('data-datekey')!));
        // if event is on current calDate, proceed
        if (isBetweenDays(changedEvent.dates.start, changedEvent.dates.end, DateOfDateColumnElement)) {
          const indicatorElement = document.createElement('div');
          indicatorElement.setAttribute('gcaltoolsid', id);
          indicatorElement.classList.add('allDayEventIndicator', 'EfQccc');
          indicatorElement.style.backgroundColor = `${changedEvent.timeElement!.style.backgroundColor}`;
          indicatorElement.style.opacity = `${calculateOpacity(changedEvent)}`;
          indicatorElement.style.top = `${calculateTop(changedEvent, DateOfDateColumnElement)}px`;
          indicatorElement.style.height = `${calculateHeight(changedEvent, DateOfDateColumnElement)}px`;
          calculateWidthAndPos(changedEvent, eventStorageMultiDay, DateOfDateColumnElement, indicatorElement, settings);

          const eventContainer = DateColumnElement.querySelector('div.feMFof.A3o4Oe');
          if (eventContainer) {
            eventContainer.appendChild(indicatorElement);
          }
        }
      }
    }
  } catch (error) {
    console.error('indicateAllDayEvents: ', error);
  }
};

/** generates ID for indicator element */
var generateID = async function (event: CalEvent) {
  const rawID = JSON.stringify([event.dates, event.timeElement!.style.backgroundColor, event.name]);
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
  let parrallelEvents = eventStorageMultiDay.filter((eventInStorage) => {
    if (
      isBetweenDays(eventInStorage.dates.start, eventInStorage.dates.end, DateOfDateColumnElement) && // event is on current Date
      (isBetweenDateTimes(eventInStorage.dates.start, eventInStorage.dates.end, event.dates.start) || // current event starts during eventInStorage
        isBetweenDateTimes(event.dates.start, event.dates.end, eventInStorage.dates.start)) // eventInStorage starts during current event
    )
      return eventInStorage;
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
