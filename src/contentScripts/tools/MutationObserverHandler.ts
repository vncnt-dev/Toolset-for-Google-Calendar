import { detectCalendarView, isFeatureActive, isVisible, type CalendarView } from '../lib/calendarView';
import { reconcileDurations } from './injectDuration';
import { hideHoverInformation, reconcileHoverInformation } from './addHoverOverInformation';
import { formatDuration } from '../lib/formatDuration';
import { CalEvent } from '../../interfaces/eventInterface';
import type { Settings } from '../../interfaces/SettingsInterface';
import { loadSettings } from '../lib/SettingsHandler';
import * as Tools from './tools';

import { getEventXhrDataById } from '../lib/parseEventData';
import { getUserInfo } from '../lib/miscellaneous';
import { decodeDataEventIdFull } from '../lib/miscellaneous';
import { loadIndicatorExclusions, isIndicatorExcluded } from '../lib/indicatorExclusionStore';
import { logging } from '../lib/logger';
import { CustomDateHandler } from '../lib/customDateHandler';
import { resetCache, setItemInCache } from '../lib/sessionCache';

MutationObserver = window.MutationObserver;
const observerCalendarView = new MutationObserver((mutationsList, observer) => {
  observerCalendarViewFunction(mutationsList);
});
const observerCompleteHTMLBody = new MutationObserver((mutationsList, observer) => {
  const root = document.querySelector('#YPCqFe');
  if (root !== observedRoot) observerCalendarViewFunction();
  void startWorkerCompleteHTMLBody(mutationsList);
});

function createObserver() {
  createObserverCalendarView();
  createObserverCompleteHTMLBody();
}

function disconnectObserver() {
  observerCalendarView.disconnect();
  observerCompleteHTMLBody.disconnect();
}

let observedRoot: Element | null = null;
const resizeObserver = new ResizeObserver(() => observerCalendarViewFunction());
let resizedRoot: Element | null = null;
function createObserverCalendarView() {
  observedRoot = document.querySelector('#YPCqFe');
  if (resizedRoot !== observedRoot) {
    resizeObserver.disconnect();
    if (observedRoot) resizeObserver.observe(observedRoot);
    resizedRoot = observedRoot;
  }
  if (!observedRoot) return;
  observerCalendarView.observe(observedRoot, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'data-datekey'],
  });
}
window.addEventListener('resize', () => observerCalendarViewFunction());
window.addEventListener('popstate', () => { hideHoverInformation(); observerCalendarViewFunction(); });

function createObserverCompleteHTMLBody() {
  observerCompleteHTMLBody.observe(document.querySelector('body')!, {
    subtree: true,
    childList: true,
  });
}

var timer: NodeJS.Timeout;
var lastTime: number = 0;
function observerCalendarViewFunction(mutationsList: MutationRecord[] = []) {
  // if lasttime is at least 100 ms ago, run worker, else wait until lasttime is at least 100 ms ago
  if (lastTime + 100 < Date.now()) {
    lastTime = Date.now();
    startWorkerCalendarView();
  } else {
    clearTimeout(timer);
    timer = setTimeout(function () {
      lastTime = Date.now();
      startWorkerCalendarView();
    }, Math.max(0, 100 - (Date.now() - lastTime)));
  }
}

let workerRunning = false;
let workerPending = false;
let bodyPending = false;
let lastView: CalendarView = 'unknown';

async function startWorkerCalendarView(settingsOverride?: Settings) {
  if (workerRunning) { workerPending = true; return; }
  workerRunning = true;
  try {
    await renderCalendarView(settingsOverride);
  } finally {
    workerRunning = false;
    if (bodyPending) {
      bodyPending = false;
      void startWorkerCompleteHTMLBody();
    }
    if (workerPending) {
      workerPending = false;
      observerCalendarViewFunction();
    }
  }
}

async function renderCalendarView(settingsOverride?: Settings) {
  logging('info', 'startWorkerCalendarView');
  let settings = settingsOverride ?? (await loadSettings());
  await loadIndicatorExclusions();
  resetCache();
  setItemInCache('userInfo', getUserInfo());
  /**
   * contains information about all events of the current view, including allOrMultiDay events
   */
  var eventStorage: CalEvent[] = [];
  /**
   * contains information about all allOrMultiDay events of the current view
   */
  var allOrMultiDayEventStorage: CalEvent[] = [];
  disconnectObserver();
  try {
    const root = document.querySelector('#YPCqFe');
    const view = detectCalendarView(root);
    const durationActive = isFeatureActive(settings, 'calcDuration', view);
    const hoverActive = isFeatureActive(settings, 'hoverInformation', view);
    if (view !== lastView || !hoverActive) hideHoverInformation();
    lastView = view;
    if (!durationActive) reconcileDurations(new Set());
    if (!hoverActive) reconcileHoverInformation(new Set());
    let calEventList = Array.from(root?.querySelectorAll<HTMLElement>('div[role="button"][data-eventid]') ?? []).filter(isVisible);
    // Stacked chips include all-day/multi-day events and every event in the month grid.
    let allOrMultiDayCalEventList = Array.from(root?.querySelectorAll<HTMLElement>('.KF4T6b.jKgTF:not(.PU9jSd)') ?? []).filter(isVisible);

    for (let calEventHtmlElement of calEventList) {
      let eventId = '';
      let occurrenceDate: string | undefined;
      try {
        const dataEventId = calEventHtmlElement.getAttribute('data-eventid')!;
        if (dataEventId.startsWith('tasks_')) {
          logging('debug', 'skipping tasks event: ', dataEventId);
          continue;
        }
        ({ id: eventId, occurrenceDate } = decodeDataEventIdFull(dataEventId));
        const originalEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!originalEvent) continue;

        const thisEvent: CalEvent = { ...originalEvent };
        if (originalEvent.dates) {
          thisEvent.dates = {
            start: originalEvent.dates.start
              ? new CustomDateHandler(new Date(originalEvent.dates.start.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.start,
            end: originalEvent.dates.end
              ? new CustomDateHandler(new Date(originalEvent.dates.end.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.end,
          };
        }

        thisEvent.parentElement = calEventHtmlElement;
        thisEvent.timeElement = (calEventHtmlElement.querySelector('div.lhydbb.gVNoLb.EiZ8Dd:not(.event-duration)') ||
          calEventHtmlElement.querySelector('.EWOIrf:not(.event-duration)')) as HTMLElement;

        if (!thisEvent.timeElement) {
          logging('warn', 'event without timeElement, will be skipped: ', thisEvent, calEventHtmlElement);
          continue;
        }
        // very short events (>1h) have a diffenent HTML structure
        if (thisEvent.timeElement?.classList.contains('EWOIrf')) thisEvent.type = 'short';

        if (!thisEvent.dates.start || !thisEvent.dates.end) continue;

        thisEvent.occurrenceToken = occurrenceDate;
        eventStorage.push({ ...thisEvent });
      } catch (error) {
        let errorMessage = '';
        if (error instanceof Error) errorMessage = error.message;
        else if (error instanceof Object) errorMessage = JSON.stringify(error);
        else errorMessage = error as string;
        logging('error', 'error while parsing event: ', eventId, errorMessage, calEventHtmlElement);
      }
    }

    for (let calEventHtmlElement of allOrMultiDayCalEventList) {
      let eventId = '';
      let allOrMultiDayOccurrenceDate: string | undefined;
      try {
        const dataEventId = calEventHtmlElement.parentElement!.getAttribute('data-eventid');
        if (!dataEventId) {
          logging('warn', 'no data-eventid found in allOrMultiDay event: ', calEventHtmlElement);
          continue;
        }
        if (dataEventId.startsWith('tasks_')) {
          logging('debug', 'skipping tasks event: ', dataEventId);
          continue;
        }
        ({ id: eventId, occurrenceDate: allOrMultiDayOccurrenceDate } = decodeDataEventIdFull(dataEventId));

        let originalEvent: CalEvent = getEventXhrDataById(eventId)!;
        if (!originalEvent) continue;

        let thisEvent: CalEvent = { ...originalEvent };
        if (originalEvent.dates) {
          thisEvent.dates = {
            start: originalEvent.dates.start
              ? new CustomDateHandler(new Date(originalEvent.dates.start.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.start,
            end: originalEvent.dates.end
              ? new CustomDateHandler(new Date(originalEvent.dates.end.getOriginalJsDateObject().getTime()))
              : originalEvent.dates.end,
          };
        }

        thisEvent.parentElement = calEventHtmlElement.parentElement!;
        thisEvent.timeElement = calEventHtmlElement;
        if (!thisEvent.dates.start || !thisEvent.dates.end) continue;
        thisEvent.occurrenceToken = allOrMultiDayOccurrenceDate;
        if (thisEvent.type === 'allDay') {
          const startDate = thisEvent.dates.start.getOriginalJsDateObject().setHours(0, 0, 0, 0);
          const endDate = new Date(startDate + (thisEvent.durationInMinutes - 1) * 60 * 1000);
          thisEvent.dates.start.setDisableTzCorrection(true).setDate(new Date(startDate));
          thisEvent.dates.end.setDisableTzCorrection(true).setDate(new Date(endDate));
        }
        if (thisEvent.type === 'allDay' || thisEvent.type === 'nonAllDayMultiDay') allOrMultiDayEventStorage.push(thisEvent);
        eventStorage.push({ ...thisEvent });
      } catch (error) {
        logging('error', 'error while parsing allOrMultiDay event: ', eventId, error, calEventHtmlElement);
      }
    }

    const durationElements = new Set<HTMLElement>();
    const hoverElements = new Set<HTMLElement>();
    for (let thisEvent of eventStorage) {
      if (!thisEvent.parentElement || !thisEvent.timeElement) continue;
      thisEvent.durationFormated = formatDuration(thisEvent.durationInMinutes,
        settings.calcDuration_durationFormat, settings.calcDuration_minimumDurationMinutes);
      if (hoverActive) {
        hoverElements.add(thisEvent.parentElement);
        Tools.addHoverOverInformation(thisEvent);
      }
      if (durationActive) durationElements.add(thisEvent.parentElement);
      Tools.injectDuration(thisEvent, settings, view);
    }
    reconcileDurations(durationElements);
    reconcileHoverInformation(hoverElements);

    if (settings.indicateAllDayEvents_isActive && (view === 'day' || view === 'multiDay')) {
      // drop excluded events before rendering, so the width distribution of remaining indicators stays correct
      const totalBeforeFilter = allOrMultiDayEventStorage.length;
      allOrMultiDayEventStorage = allOrMultiDayEventStorage.filter((event) => !isIndicatorExcluded(event.id, event.occurrenceToken));
      if (totalBeforeFilter !== allOrMultiDayEventStorage.length) {
        logging('info', `indicateAllDayEvents: ${totalBeforeFilter - allOrMultiDayEventStorage.length} event(s) excluded by user`);
      }
      await Tools.indicateAllDayEvents(allOrMultiDayEventStorage, settings);
    }

    logging('info', 'events number: ', eventStorage.length, ' storage: ', eventStorage);
    logging('info', 'allOrMultiDayEvents number: ', allOrMultiDayEventStorage.length, ' storage: ', allOrMultiDayEventStorage);
    setItemInCache('eventStorage', eventStorage);
    setItemInCache('allOrMultiDayEvents', allOrMultiDayEventStorage);
    // The indicator renderer awaits hashes. Google may navigate while our observers are paused.
    if (document.querySelector('#YPCqFe') !== root || detectCalendarView() !== view ||
        eventStorage.some(event => !event.parentElement?.isConnected)) workerPending = true;
  } catch (error) {
    logging('error', 'error: ', error);
  } finally {
    createObserver();
  }
}

async function startWorkerCompleteHTMLBody(mutationsList: MutationRecord[] = [], settingsOverride?: Settings) {
  if (workerRunning) { bodyPending = true; return; }
  const settings = settingsOverride ?? (await loadSettings());
  if (workerRunning) { bodyPending = true; return; }
  disconnectObserver();
  if (settings.removeGMeets_isActive) Tools.removeGMeets();
  if (settings.exportAsIcs_isActive) Tools.exportToIcalPrepare();
  if (settings.indicateAllDayEvents_isActive) void Tools.hideIndicatorPrepare();
  createObserver();
}

export { startWorkerCalendarView, startWorkerCompleteHTMLBody, observerCalendarViewFunction };
