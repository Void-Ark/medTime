/**
 * Returns a Date object with the specified hours and minutes.
 * Seconds and milliseconds are set to 0.
 *
 * @param hours - 0 to 23
 * @param minutes - 0 to 59
 * @returns Date object representing today at the given time
 */
export default function getTimeAsDate(hours: number, minutes: number): Date {
  const now = new Date();
  now.setHours(hours);
  now.setMinutes(minutes);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
}

// Example usage:
// const morningTime = getTimeAsDate(8, 0); // 08:00 AM today
// const nightTime = getTimeAsDate(22, 30); // 10:30 PM today
