import React from 'react';
import ICAL from 'ical.js';
import { CalEvent } from '../../interfaces/eventInterface';
import { getItemFromCache } from '../lib/sessionCache';
import { addIndicatorExclusion, removeIndicatorExclusions, isIndicatorExcluded } from '../lib/indicatorExclusionStore';
import {
  decodeDataEventIdFull,
  parseCompactDateToken,
  getOccurrenceEndDate,
  getRecurrenceEndDate,
  JsxElementToHtmlElement,
  sleep,
} from '../lib/miscellaneous';
import { logging } from '../lib/logger';

const MENU_ITEM_ID = 'hideIndicatorMenuItem';

/**
 * Adds a "Hide indicator" entry to the three-dot-menu of the event details popup
 * (same mechanism as "Export to iCal"), but only shows it for all-day / multi-day events.
 * For recurring events a dialog asks whether the whole series or only this occurrence should be hidden.
 */
const hideIndicatorPrepare = async () => {
  await sleep(1000); // wait a bit to make sure the popup is loaded
  const popupView = document.getElementById('xDetDlg');
  if (!popupView) return;
  logging('info', 'Preparing "hide indicator" menu item');

  const menuItem = document.querySelector('div > div > ul[data-list-type][aria-label]');
  if (!menuItem) {
    logging('warn', 'Could not find menu item container for hide indicator');
    return;
  }

  const existingItem = document.getElementById(MENU_ITEM_ID);
  if (!existingItem) {
    // reuse google styles from the export-to-ical menu item
    const hideIndicatorMenuItem = JsxElementToHtmlElement(
      <li
        id={MENU_ITEM_ID}
        role="menuitem"
        className="aqdrmf-rymPhb-ibnC6b aqdrmf-rymPhb-ibnC6b-OWXEXe-hXIJHe aqdrmf-rymPhb-ibnC6b-OWXEXe-SfQLQb-Woal0c-RWgCYc O68mGe-OQAXze-OWXEXe-SfQLQb-Woal0c-RWgCYc"
      >
        <span className="UTNHae"></span>
        <span className="dNKuRb aqdrmf-rymPhb-sNKcce"></span>
        <span className="aqdrmf-rymPhb-KkROqb"></span>
        <span className="aqdrmf-rymPhb-Gtdoyb">
          <span className="aqdrmf-rymPhb-fpDzbe-fmcmS">Hide background indicator</span>
        </span>
        <span className="aqdrmf-rymPhb-JMEf7e"></span>
        <span className="O68mGe-xl07Ob-mQXhdd"></span>
      </li>,
    );
    hideIndicatorMenuItem.addEventListener('click', () => {
      void handleHideIndicatorClick();
    });
    menuItem.appendChild(hideIndicatorMenuItem);
  }

  updateMenuItemVisibility(popupView);
};

/** only show the menu item if the currently open event is an all-day or multi-day event, and toggle its label */
function updateMenuItemVisibility(popupView: HTMLElement | null) {
  const item = document.getElementById(MENU_ITEM_ID);
  if (!item) return;
  const activeEvent = resolveActivePopupEvent(popupView);
  const isVisible = !!activeEvent && (activeEvent.type === 'allDay' || activeEvent.type === 'nonAllDayMultiDay');
  item.setAttribute('style', isVisible ? '' : 'display: none;');

  // toggle label between "Hide" and "Show" depending on exclusion state
  const labelElement = item.querySelector('.aqdrmf-rymPhb-fpDzbe-fmcmS');
  if (labelElement && activeEvent) {
    const excluded = isIndicatorExcluded(activeEvent.id, activeEvent.occurrenceToken);
    labelElement.textContent = excluded ? 'Show background indicator' : 'Hide background indicator';
  }
}

function resolveActivePopupEvent(popupView: HTMLElement | null): CalEvent | undefined {
  if (!popupView) return undefined;
  const activeEventId = popupView.getAttribute('data-eventid');
  if (!activeEventId) return undefined;
  const eventStorage: CalEvent[] = getItemFromCache('eventStorage') || [];
  return eventStorage.find((event) => event.parentElement?.getAttribute('data-eventid') === activeEventId);
}

async function handleHideIndicatorClick() {
  const activeEvent = resolveActivePopupEvent(document.getElementById('xDetDlg'));
  if (!activeEvent || (activeEvent.type !== 'allDay' && activeEvent.type !== 'nonAllDayMultiDay')) {
    return;
  }

  const { occurrenceDate } = decodeDataEventIdFull(activeEvent.parentElement!.getAttribute('data-eventid')!);

  // toggle: if already excluded, show the indicator again (removes any matching exclusion)
  if (isIndicatorExcluded(activeEvent.id, occurrenceDate)) {
    await showIndicatorAgain(activeEvent, occurrenceDate);
    return;
  }

  const isRecurring = !!activeEvent.recurrenceRule || activeEvent.id.includes('_');
  if (isRecurring) {
    openRecurringDialog(activeEvent, occurrenceDate);
  } else {
    const success = await addIndicatorExclusion({
      id: activeEvent.id,
      scope: 'single',
      name: activeEvent.name,
      startDate: activeEvent.dates?.start?.getOriginalJsDateObject().getTime(),
      endDate: activeEvent.dates?.end?.getOriginalJsDateObject().getTime(),
    });
    if (success) {
      refreshIndicators();
    } else {
      showToast('Could not hide indicator: exclusion list is full.');
    }
  }
}

/** removes every exclusion matching this event (single entry, series or occurrence) */
async function showIndicatorAgain(event: CalEvent, occurrenceDate?: string) {
  const underscoreIndex = event.id.indexOf('_');
  const seriesId = underscoreIndex === -1 ? event.id : event.id.slice(0, underscoreIndex);
  const occurrenceKey = underscoreIndex !== -1 ? event.id : `${event.id}_${occurrenceDate}`;
  await removeIndicatorExclusions([event.id, seriesId, occurrenceKey].filter(Boolean) as string[]);
  refreshIndicators();
}

function openRecurringDialog(event: CalEvent, occurrenceDate?: string) {
  closeRecurringDialog();

  /* exception ids look like "<seriesId>_<date>", series masters are plain ids */
  const underscoreIndex = event.id.indexOf('_');
  const seriesId = underscoreIndex === -1 ? event.id : event.id.slice(0, underscoreIndex);
  const occurrenceKey = underscoreIndex !== -1 ? event.id : `${event.id}_${occurrenceDate}`;
  const seriesEndDate = getRecurrenceEndDate(event);
  const recurrenceSummary = getRecurrenceSummary(event.recurrenceRule);

  const eventName = escapeHtml(event.name || 'this event');
  const occurrenceStart = parseCompactDateToken(occurrenceDate);
  const occurrenceEnd = occurrenceStart !== undefined ? getOccurrenceEndDate(event, occurrenceStart) : undefined;
  const eventStart = event.dates?.start?.getOriginalJsDateObject().getTime();

  const dateInfoRows: Array<[string, string]> = [];
  if (occurrenceStart !== undefined) {
    const isSameDay =
      occurrenceEnd !== undefined && new Date(occurrenceStart).toDateString() === new Date(occurrenceEnd).toDateString();
    dateInfoRows.push([
      'This occurrence',
      isSameDay ? formatDateLong(occurrenceStart) : `${formatDateLong(occurrenceStart)} – ${formatDateLong(occurrenceEnd)}`,
    ]);
  }
  if (eventStart !== undefined) {
    dateInfoRows.push([
      'Series',
      `${formatDateLong(eventStart)}${seriesEndDate !== undefined ? ` – ${formatDateLong(seriesEndDate)}` : ' (no end date)'}`,
    ]);
  }

  const dialog = JsxElementToHtmlElement(
    <div id="GCTHideIndicatorDialog" style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--gm3-sys-color-surface-container-high, #fff)',
          color: 'var(--gm3-sys-color-on-surface, #1f1f1f)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '90vw',
          boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
          fontFamily: 'Roboto, Arial, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 500 }}>Hide background indicator</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
          "{eventName}" is part of a recurring event series.
        </p>
        <div style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: 1.6 }}>
          {dateInfoRows.map(([label, value]) => (
            <div key={label}>
              <b>{label}:</b> {value}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button id="GCTHideSeriesBtn" style={dialogButtonStyle}>Hide entire series</button>
          <button id="GCTHideOccurrenceBtn" style={dialogButtonStyle}>Hide only this occurrence</button>
          <button id="GCTHideCancelBtn" style={{ ...dialogButtonStyle, border: 'none', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>,
  );

  document.body.appendChild(dialog);

  const hideFor = async (id: string, scope: 'series' | 'occurrence', endDate?: number, startDate?: number, rule?: string) => {
    const success = await addIndicatorExclusion({ id, scope, name: event.name, startDate, endDate, rule });
    closeRecurringDialog();
    if (success) {
      refreshIndicators();
    } else {
      showToast('Could not hide indicator: exclusion list is full.');
    }
  };

  dialog.querySelector('#GCTHideSeriesBtn')!.addEventListener('click', () => {
    void hideFor(seriesId, 'series', seriesEndDate, event.dates?.start?.getOriginalJsDateObject().getTime(), recurrenceSummary);
  });
  dialog.querySelector('#GCTHideOccurrenceBtn')!.addEventListener('click', () => {
    // pruning basis: end of this occurrence (= occurrence start + event duration)
    const occurrenceStart = parseCompactDateToken(occurrenceDate);
    const occurrenceEnd = getOccurrenceEndDate(event, occurrenceStart);
    void hideFor(occurrenceKey, 'occurrence', occurrenceEnd, occurrenceStart);
  });
  dialog.querySelector('#GCTHideCancelBtn')!.addEventListener('click', closeRecurringDialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeRecurringDialog();
  });
}

function closeRecurringDialog() {
  document.getElementById('GCTHideIndicatorDialog')?.remove();
}

function refreshIndicators() {
  // remove existing indicators, they are recreated by the next worker run (storage.onChanged)
  document.querySelectorAll('.allDayEventIndicator').forEach((element) => element.remove());
  // keep the menu label in sync with the new state
  updateMenuItemVisibility(document.getElementById('xDetDlg'));
}

/** locale-formatted date, f.e. "Jan 6, 2025"; undefined-safe */
function formatDateLong(ms?: number): string {
  if (ms === undefined) return '?';
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * human-readable recurrence summary for the blacklist display, built from the relevant RRULE tokens:
 * "FREQ=WEEKLY;WKST=MO;COUNT=3;BYDAY=TU,WE,TH,FR" -> "Weekly on Tu, We, Th, Fr, 3×"
 */
function getRecurrenceSummary(recurrenceRule?: string): string | undefined {
  if (!recurrenceRule) return undefined;
  const getToken = (key: string) => new RegExp(`(?:^|;)${key}=([^;]+)`, 'i').exec(recurrenceRule)?.[1];

  const freqLabels: Record<string, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
  };
  const unitLabels: Record<string, string> = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' };

  const freq = getToken('FREQ')?.toUpperCase();
  const base = freq ? freqLabels[freq] : undefined;
  if (!freq || !base) return undefined;

  const parts: string[] = [base];

  const interval = parseInt(getToken('INTERVAL') ?? '1');
  if (interval > 1 && unitLabels[freq]) parts.push(`every ${interval} ${unitLabels[freq]}s`);

  const byDay = getToken('BYDAY');
  if (byDay) parts.push(`on ${byDay.split(',').map((day) => day.replace(/^[+-]?\d+/, '')).join(', ')}`);

  const count = getToken('COUNT');
  if (count) parts.push(`${count}×`);

  return parts.join(' ');
}

const dialogButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid var(--gm-hairlinebutton-outline-color, rgb(218,220,224))',
  backgroundColor: 'var(--gm3-sys-color-surface, #fff)',
  color: 'var(--gm3-sys-color-primary, #0b57d0)',
  fontSize: '14px',
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
};

/** minimal self-contained toast with optional undo action */
function showToast(message: string) {
  document.getElementById('GCTHideIndicatorToast')?.remove();

  const toast = JsxElementToHtmlElement(
    <div
      id="GCTHideIndicatorToast"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 10001,
        backgroundColor: '#323232',
        color: '#fff',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '13px',
        fontFamily: 'Roboto, Arial, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        maxWidth: '420px',
      }}
    >
      <span>{escapeHtml(message)}</span>
    </div>,
  );

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export { hideIndicatorPrepare };
