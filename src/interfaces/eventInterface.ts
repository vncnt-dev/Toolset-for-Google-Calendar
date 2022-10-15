export interface Event {
  type?: 'normal' | 'short' | 'multiDay';
  id: string;
  parentElement?: HTMLElement;
  eventTime: Date[];
  eventTimeElement?: HTMLElement;
  duration: number;
  durationFormated: string | null;
  eventName: string;
  eventLocation: string;
  eventCalendar: [string, string]; // [calendarName, calendarId]
}
