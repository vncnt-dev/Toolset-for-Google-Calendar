import { get } from 'http';
import { getItemFromCache } from './sessionCache';
import { UserInfo } from '../../interfaces/userInfo';

export class CustomDateHandler {
  private date: Date;
  private parts: { [key: string]: string } = {};

  constructor(date: Date) {
    this.date = date;
    this.deconstructDate();
  }

  deconstructDate() {
    let userData = getItemFromCache('userInfo') as UserInfo;
    let timeZone = userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(this.date);
    const dateParts: { [key: string]: string } = {};
    for (const part of parts) {
      if (part.type !== 'literal') dateParts[part.type] = part.value;
    }
    this.parts = dateParts;
  }

  getOriginalJsDateObject() {
    return this.date;
  }

  getJsDateObject() {
    return new Date(
      parseInt(this.parts.year),
      parseInt(this.parts.month) - 1, // month is 0-indexed in Date
      parseInt(this.parts.day),
      parseInt(this.parts.hour),
      parseInt(this.parts.minute),
      parseInt(this.parts.second),
    );
  }

  getTime() {
    return this.date.getTime();
  }

  getHours() {
    return parseInt(this.parts.hour);
  }
  getMinutes() {
    return parseInt(this.parts.minute);
  }
}
