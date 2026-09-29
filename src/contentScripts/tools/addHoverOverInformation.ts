import type { CalEvent } from '../../interfaces/eventInterface';
import { isSameDay } from '../lib/miscellaneous';
import { getSettingsSnapshot } from '../lib/SettingsHandler';
import { detectCalendarView, isFeatureActive } from '../lib/calendarView';
import { formatDuration } from '../lib/formatDuration';

const events = new WeakMap<HTMLElement, CalEvent>();
let activeElements = new Set<HTMLElement>();
let hoveredElement: HTMLElement | null = null;

export function hideHoverInformation() {
  const tooltip = document.getElementById('hoverInformationElement');
  if (tooltip) tooltip.style.visibility = 'hidden';
  hoveredElement = null;
}

export function reconcileHoverInformation(elements: Set<HTMLElement>) {
  activeElements = elements;
  if (hoveredElement && (!elements.has(hoveredElement) || !hoveredElement.isConnected)) hideHoverInformation();
}

export function addHoverOverInformation(event: CalEvent) {
  const element = event.parentElement;
  if (!element) return;
  const bound = events.has(element);
  events.set(element, event);
  if (bound) return;

  element.addEventListener('mousemove', (mouseEvent) => {
    const settings = getSettingsSnapshot();
    if (!activeElements.has(element) || !isFeatureActive(settings, 'hoverInformation', detectCalendarView())) {
      hideHoverInformation();
      return;
    }
    const current = events.get(element)!;
    const tooltip = document.getElementById('hoverInformationElement');
    const content = document.getElementById('hoverInformationElementText');
    if (!tooltip || !content) return;
    let text = formatTime(current);
    const duration = formatDuration(current.durationInMinutes, settings.calcDuration_durationFormat, settings.calcDuration_minimumDurationMinutes);
    if (duration) text += ` (${duration})`;
    if (current.name) text += `\n${current.name}`;
    if (current.location) text += `\n${current.location}`;
    if (current.description) text += `\n\n${current.description}`;
    if (content.textContent !== text) content.textContent = text;
    hoveredElement = element;
    tooltip.style.visibility = 'visible';
    tooltip.style.top = `${mouseEvent.clientY + tooltip.clientHeight > window.innerHeight
      ? mouseEvent.clientY - tooltip.clientHeight + 10 : mouseEvent.clientY - 10}px`;
    tooltip.style.left = `${mouseEvent.clientX}px`;
  });
  element.addEventListener('mouseleave', hideHoverInformation);
}

function formatTime(event: CalEvent): string {
  let eventTimes = event.dates;
  let lang: Intl.LocalesArgument = document.documentElement.lang;

  if (isSameDay(eventTimes.start, eventTimes.end)) {
    if (event.type === 'allDay') {
      let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return eventTimes.start.getJsDateObject().toLocaleDateString(lang, options);
    }

    const timeFormatter = new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const startTime = timeFormatter.format(eventTimes.start.getJsDateObject());
    const endTime = timeFormatter.format(eventTimes.end.getJsDateObject());

    return `${startTime} - ${endTime}`;
  } else {
    let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (event.type !== 'allDay') options = { ...options, hour: '2-digit', minute: '2-digit' };

    return (
      eventTimes.start.getJsDateObject().toLocaleDateString(lang, options) +
      ' - ' +
      eventTimes.end.getJsDateObject().toLocaleDateString(lang, options)
    );
  }
}
