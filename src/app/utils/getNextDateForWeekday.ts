import { DateTime } from 'luxon';

export function getNextDateForWeekday(weekdayName: string, timeString: string, timezone: string): DateTime {
  console.log(`Computing next date for weekday: ${weekdayName}, time: ${timeString}, timezone: ${timezone}`);

  const now = DateTime.now().setZone(timezone);
  const weekdayMap: { [key: string]: number } = {
    sunday: 7,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const targetWeekday = weekdayMap[weekdayName.toLowerCase()];
  if (!targetWeekday) {
    throw new Error(`Invalid weekday: ${weekdayName}`);
  }

  const currentWeekday = now.weekday; // 1 = Monday, 7 = Sunday
  let daysToAdd = targetWeekday - currentWeekday;

  if (daysToAdd <= 0) {
    daysToAdd += 7; // Next week if today or past
  }

  // If today and time is in the future, use today
  if (daysToAdd === 7 && now.toFormat('HH:mm') < timeString) {
    daysToAdd = 0;
  }

  const targetDate = now.plus({ days: daysToAdd }).startOf('day');
  const [hours, minutes] = timeString.split(':').map(Number);
  const reservationDateTime = targetDate.set({ hour: hours, minute: minutes });

  console.log(`Computed reservation date: ${reservationDateTime.toISO()}`);
  return reservationDateTime;
}
