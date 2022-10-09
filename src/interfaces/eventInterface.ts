export interface Event {
  type?: 'normal' | 'short' | 'multiDay';
  dataEventId: string;
  parentElement?: HTMLElement;
  eventTime: Date[];
  eventTimeElement?: HTMLElement;
  duration: number;
  durationFormated: string | null;
  eventName: string;
  eventLocation: string;
  eventCalendar: [string, string]; // [calendarName, calendarId]
}
