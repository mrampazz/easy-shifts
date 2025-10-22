import type { Shift, NurseStats, Nurse, ScheduleRules } from '../types';
import { getWeeksInMonth } from './dateHelpers';

export const calculateNurseStats = (
  nurse: Nurse,
  shifts: Shift[],
  rules: ScheduleRules,
  month: Date
): NurseStats => {
  const nurseShifts = shifts.filter(shift => 
    shift.assignedNurses.includes(nurse.id)
  );

  // Count shifts by index instead of hardcoded types
  const shiftCounts = new Map<number, number>();
  nurseShifts.forEach(s => {
    const idx = s.shiftIndex ?? 0;
    shiftCounts.set(idx, (shiftCounts.get(idx) || 0) + 1);
  });

  // For backwards compatibility, use first two shift types as "day" and "night"
  const dayShifts = shiftCounts.get(0) || 0;
  const nightShifts = shiftCounts.get(1) || 0;
  const totalShifts = nurseShifts.length;
  const totalHours = totalShifts * rules.shiftDurationHours;

  const weeksInMonth = getWeeksInMonth(month);
  const averageHoursPerWeek = totalHours / weeksInMonth;

  // Calculate consecutive shift streak
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  const sortedShifts = [...nurseShifts].sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );

  for (let i = 0; i < sortedShifts.length; i++) {
    if (i === 0) {
      currentConsecutive = 1;
    } else {
      const dayDiff = Math.floor(
        (sortedShifts[i].date.getTime() - sortedShifts[i - 1].date.getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (dayDiff === 1) {
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }
  }
  maxConsecutive = Math.max(maxConsecutive, currentConsecutive);

  // Count unique days worked
  const uniqueDays = new Set(
    nurseShifts.map(s => s.date.toDateString())
  ).size;

  return {
    nurseId: nurse.id,
    nurseName: nurse.name,
    totalShifts,
    dayShifts,
    nightShifts,
    totalHours,
    averageHoursPerWeek,
    consecutiveShiftStreak: maxConsecutive,
    daysWorked: uniqueDays,
  };
};

export const calculateAllNurseStats = (
  nurses: Nurse[],
  shifts: Shift[],
  rules: ScheduleRules,
  month: Date
): NurseStats[] => {
  return nurses.map(nurse => calculateNurseStats(nurse, shifts, rules, month));
};
