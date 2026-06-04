import { Medicine } from "@/schemas";

/**
 * Checks if a medicine's schedule has ended, taking into account:
 * - isArchived
 * - endDate (if specified)
 * - timings (finding the latest dose on the end date)
 * - intake history (checking if the final dose has already been taken today)
 * 
 * @param med - The medicine record
 * @param historyLogs - List of intake logs
 * @returns boolean indicating if the schedule has ended
 */
export function isMedicineScheduleEnded(med: Medicine, historyLogs: any[]): boolean {
  if (med.isArchived) return true;
  if (!med.endDate) return false;

  const today = new Date();
  const end = new Date(med.endDate);

  // 1. Compare dates at midnight zero-time
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (todayZero > endZero) {
    return true;
  }
  if (todayZero < endZero) {
    return false;
  }

  // 2. Today is exactly the end date. We must check timings and intake status.
  const timings = med.timings || [];
  if (timings.length === 0) {
    // If no timings, we default to active until the day ends
    return false;
  }

  // Find the latest timing of the day (max hour & minute)
  let maxHour = -1;
  let maxMinute = -1;
  timings.forEach((t) => {
    const timeDate = new Date(t);
    const h = timeDate.getHours();
    const m = timeDate.getMinutes();
    if (h > maxHour || (h === maxHour && m > maxMinute)) {
      maxHour = h;
      maxMinute = m;
    }
  });

  if (maxHour === -1) {
    return false;
  }

  // Construct the exact final scheduled dose time
  const finalScheduledTime = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    maxHour,
    maxMinute,
    0,
    0
  );

  // Active window for the last dose ends 1 hour after finalScheduledTime
  const windowEnd = finalScheduledTime.getTime() + 60 * 60 * 1000;

  if (today.getTime() > windowEnd) {
    return true; // Past the window for the final dose
  }

  // If we are before windowEnd but the final dose was already taken, it has ended
  const windowStart = finalScheduledTime.getTime() - 60 * 60 * 1000;
  const isLastDoseTaken = historyLogs.some((log) => {
    if (log.medicineId !== med.id) return false;
    const logTime = new Date(log.takenAt).getTime();
    return logTime >= windowStart && logTime <= windowEnd;
  });

  return isLastDoseTaken;
}
