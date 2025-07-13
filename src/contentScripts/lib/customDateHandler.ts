import { getItemFromCache } from './sessionCache';
import { UserInfo } from '../../interfaces/userInfo';

export class CustomDateHandler {
  private date: Date;
  private parts: { [key: string]: string } = {};
  private disableTzCorrection: boolean = false;

  constructor(date: Date) {
    this.date = date;
    this.deconstructDate();
    return this;
  }

  setDisableTzCorrection(disableTzCorrection: boolean) {
    this.disableTzCorrection = disableTzCorrection;
    return this;
  }

  setDate(date: Date) {
    this.date = date;
    this.deconstructDate();
    return this;
  }

  deconstructDate() {
    let userData = getItemFromCache('userInfo') as UserInfo;

    let timeZone;
    if (this.disableTzCorrection || !userData || !userData.timezone) {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } else {
      timeZone = userData.timezone;
    }

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
