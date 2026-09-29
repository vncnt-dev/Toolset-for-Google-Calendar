import type { CalEvent } from '../../interfaces/eventInterface';
import type { Settings } from '../../interfaces/SettingsInterface';
import { type CalendarView, isFeatureActive } from '../lib/calendarView';
import { formatDuration } from '../lib/formatDuration';

type StyleChange = { element: HTMLElement; property: string; original: string; priority: string; applied: string };
type DurationRecord = { node: HTMLElement; changes: StyleChange[] };
const records = new Map<HTMLElement, DurationRecord>();

function setStyle(record: DurationRecord, element: HTMLElement, property: string, value: string) {
  record.changes.push({ element, property, original: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property), applied: value });
  element.style.setProperty(property, value);
}

const inheritedTextProperties = [
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-decoration',
] as const;

/** Match Google's rendered time label without copying its layout classes. */
function copyTextStyle(source: HTMLElement, target: HTMLElement) {
  const sourceStyle = getComputedStyle(source);
  for (const property of inheritedTextProperties) {
    target.style.setProperty(property, sourceStyle.getPropertyValue(property));
  }
}

function removeDuration(element: HTMLElement) {
  const record = records.get(element);
  if (!record) return;
  record.node.remove();
  for (const change of record.changes) {
    // Google may have updated the same element since we rendered it.
    if (change.element.style.getPropertyValue(change.property) !== change.applied ||
        change.element.style.getPropertyPriority(change.property) !== '') continue;
    if (change.original) change.element.style.setProperty(change.property, change.original, change.priority);
    else change.element.style.removeProperty(change.property);
  }
  records.delete(element);
}

/** Also removes decorations for events no longer available in the metadata cache. */
export function reconcileDurations(activeElements: Set<HTMLElement>) {
  for (const element of records.keys()) {
    if (!element.isConnected || !activeElements.has(element)) removeDuration(element);
  }
}

export function injectDuration(event: CalEvent, settings: Settings, view: CalendarView) {
  const element = event.parentElement;
  const time = event.timeElement;
  if (!element) return;
  const text = formatDuration(event.durationInMinutes, settings.calcDuration_durationFormat, settings.calcDuration_minimumDurationMinutes);
  if (!time || !text || !isFeatureActive(settings, 'calcDuration', view) ||
      (event.type === 'allDay' && settings.calcDuration_disableForAllDayEvents)) {
    removeDuration(element);
    return;
  }

  // Restore native layout before measuring. Workers disconnect their MutationObserver while rendering.
  removeDuration(element);
  const stackedLabel = time.querySelector<HTMLElement>('.nHqeVd');
  const target = stackedLabel ?? time;
  const nativeText = stackedLabel?.querySelector<HTMLElement>('.DvyQhe, .WBi6vc') ?? time;
  const node = document.createElement('span');
  node.className = 'event-duration';
  node.style.cssText = 'white-space:nowrap;pointer-events:none;';
  copyTextStyle(nativeText, node);
  const record: DurationRecord = { node, changes: [] };
  records.set(element, record);

  if (view === 'monthGrid') {
    // Append to the existing single-line label. Never clone a Google layout element.
    if (!stackedLabel) { removeDuration(element); return; }
    const nativeChildren = Array.from(target.children) as HTMLElement[];
    const widths = nativeChildren.map(child => child.getBoundingClientRect().width);
    const nativeHeight = element.getBoundingClientRect().height;
    node.textContent = `(${text})`;
    node.style.cssText += 'display:inline;flex:0 0 auto;margin-inline-start:4px;padding:0;';
    target.append(node);
    const clipped = target.scrollWidth > target.clientWidth + 1 ||
      element.scrollWidth > element.clientWidth + 1 ||
      element.getBoundingClientRect().height > nativeHeight + 0.5 ||
      nativeChildren.some((child, index) => child.getBoundingClientRect().width < widths[index] - 0.5 ||
        child.scrollWidth > child.clientWidth + 1);
    if (clipped) node.style.display = 'none';
    return;
  }

  const container = time.parentElement;
  if (!container) { removeDuration(element); return; }
  const height = Array.from(container.children).reduce((sum, child) => sum + (child as HTMLElement).clientHeight, 0);
  const inline = !!stackedLabel || event.type === 'short' || element.clientHeight < height + 15;
  node.textContent = inline ? `(${text})` : text;
  node.style.display = inline ? 'inline' : 'block';
  if (inline) node.style.marginInlineStart = '5px';
  if (stackedLabel) target.append(node);
  else if (inline) {
    // Share the time label's line box and opacity. Adjacent inline-blocks can
    // use different baselines when Google's label has overflow clipping.
    for (const property of inheritedTextProperties) node.style.setProperty(property, 'inherit');
    time.append(node);
  }
  else {
    // A separate duration line must also match dimmed native time labels.
    node.style.opacity = getComputedStyle(time).opacity;
    setStyle(record, time, 'display', 'block');
    time.after(node);
  }
  setStyle(record, container, 'white-space', 'nowrap');
}
