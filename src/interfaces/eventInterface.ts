export interface Event {
  type: 'normal' | 'short' | 'multiDay';
  parentElement: HTMLElement;
  eventTime: Date[];
  eventTimeElement: HTMLElement;
  duration: number;
  durationFormated: string | null;
  eventName: string;
  eventCalender: string;
}
