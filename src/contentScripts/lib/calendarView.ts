import type { Settings, ViewSelection } from '../../interfaces/SettingsInterface';

export type CalendarView = keyof ViewSelection | 'unsupported' | 'unknown';
export type ViewFeature = 'calcDuration' | 'hoverInformation';

export function normalizeViewSelection(value?: Partial<ViewSelection> | null): ViewSelection {
  return {
    day: typeof value?.day === 'boolean' ? value.day : true,
    multiDay: typeof value?.multiDay === 'boolean' ? value.multiDay : true,
    monthGrid: typeof value?.monthGrid === 'boolean' ? value.monthGrid : true,
  };
}

export function isFeatureActive(settings: Settings, feature: ViewFeature, view: CalendarView): boolean {
  return view !== 'unknown' && view !== 'unsupported' &&
    settings[`${feature}_isActive`] && settings[`${feature}_views`][view];
}

export function isVisible(element: Element): boolean {
  return element.getClientRects().length > 0 && !element.closest('[hidden], [aria-hidden="true"]');
}

/** Inspect the main calendar only; the sidebar also contains a calendar grid. */
export function detectCalendarView(root = document.querySelector('#YPCqFe'), pathname = location.pathname): CalendarView {
  if (/\/(year|agenda|schedule)(\/|$)/.test(pathname)) return 'unsupported';
  if (!root) return 'unknown';
  const grids = Array.from(root.querySelectorAll<HTMLElement>('[role="grid"]')).filter(isVisible);
  // During transitions both layouts may be mounted. Wait for an unambiguous layout.
  if (grids.length !== 1) return 'unknown';
  const grid = grids[0];
  const columns = Array.from(grid.querySelectorAll('.BiKU4b[data-datekey]')).filter(isVisible);
  if (columns.length) {
    const days = new Set(columns.map(column => column.getAttribute('data-datekey')));
    return days.size === 1 ? 'day' : 'multiDay';
  }
  // Google uses this same stacked grid for month and custom multi-week views.
  if (grid.matches('.RAaXne') && grid.querySelector('[role="row"] [role="gridcell"]')) return 'monthGrid';
  return 'unknown';
}
