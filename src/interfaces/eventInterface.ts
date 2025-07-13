import { CustomDateHandler } from "../contentScripts/lib/customDateHandler";

export interface CalEvent {
  id: string;
  name: string;
  dataEntryCreatedAt: Date;
  /**
   * **allDay:** starts at 00:00 and ends at 23:59, can be multiple days long; marked as "allDay" within google calendar
   *
   * **nonAllDayMultiDay:** starts and ends at any time, can be multiple days long
   *
   * **short:** very short events (ca. < 1h) have a diffenent HTML structure that normal <24h events
   *
   * **normal:** default, <24h but not short
   */
  type?: 'normal' | 'short' | 'allDay' | 'nonAllDayMultiDay';
  parentElement?: HTMLElement;
  dates: EventDates;
  timeElement?: HTMLElement;
  duration: number;
  durationFormated: string | null;
  description: string;
  recurrenceRule?: string; // https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html
  location: string;
  calendar: {
    id: string;
    name: string;
  };
}

export interface EventDates {
  start: CustomDateHandler;
  end: CustomDateHandler;
}
