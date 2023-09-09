export interface Event {
  type?: 'normal' | 'short' | 'multiDay';
  id: string;
  parentElement?: HTMLElement;
  dates:EventDates
  timeElement?: HTMLElement;
  duration: number;
  durationFormated: string | null;
  name: string;
  description: string;
  recurrenceRule?: string; // https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html
  location: string;
  calendar: {
    id: string;
    name: string;
  };
}

export interface EventDates {
  start: Date;
  end: Date;
  areCorrectedTimes: Boolean;
}
