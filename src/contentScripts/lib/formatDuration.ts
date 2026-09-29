/* Format Date */
export function formatDuration(diff: number, format: string, minDurationMinutes: number): string | null {
  // if diff is less than minDurationMinutes, return nothing
  if (minDurationMinutes && diff < minDurationMinutes) return null;
  switch (format) {
    case 'decimalHours':
      var durationInHours = diff / 60;
      if (durationInHours % 24 > 23.99) durationInHours = Math.ceil(durationInHours);
      if (durationInHours < 24) return durationInHours.toFixed(2) + ' ' + (durationInHours <= 1 ? 'hour' : 'hours');
      // duration of full and multi-day events in days rather than hours
      let durationInDays = durationInHours / 24;
      return durationInDays.toFixed(2) + ' ' + (durationInDays > 1 ? 'days' : 'day');
    case 'hourMinutes': // is default case
    default:
      var durationInHours = diff / 60;

      if (durationInHours % 24 > 23.99)
        // if 23:59, round up to 24 hours
        durationInHours = Math.ceil(durationInHours);

      let hours = Math.floor(durationInHours);
      let minutes = Math.floor((durationInHours - hours) * 60);

      // also display days if duration is greater than 24 hours
      let days: number = 0;
      if (durationInHours >= 24) {
        days = Math.floor(durationInHours / 24);
        hours = hours - days * 24;
      }

      let returnString = '';
      if (days > 0) returnString += days + 'd ';
      if (hours > 0) returnString += hours + 'h ';
      if (minutes > 0) returnString += minutes + 'm';

      return returnString.trim();
  }
}

