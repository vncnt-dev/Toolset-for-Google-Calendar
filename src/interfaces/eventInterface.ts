export interface Event {
  type?: 'normal' | 'short' | 'multiDay';
  id: string;
  parentElement?: HTMLElement;
  eventTime: Date[];
  eventTimeElement?: HTMLElement;
  duration: number;
  durationFormated: string | null;
  eventName: string;
  description: string;
  recurrenceRule?: string; // https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html
  eventLocation: string;
  eventCalendar: [string, string]; // [calendarName, calendarId]
}
