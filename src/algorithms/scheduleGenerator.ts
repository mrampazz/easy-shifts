import type { Shift, Nurse, ScheduleRules, Schedule } from '../types';
import { getMonthDays } from '../utils/dateHelpers';
import { canAssignNurseToShift } from './constraintChecker';
import { subMonths, endOfMonth } from 'date-fns';

/**
 * Generate a complete schedule for a month
 */
export const generateSchedule = (
  month: Date,
  nurses: Nurse[],
  rules: ScheduleRules,
  scheduleHistory?: Map<string, Schedule>
): Schedule => {
  const monthDays = getMonthDays(month);
  const shifts: Shift[] = [];

  // Get previous month's shifts for constraint checking
  const previousMonthShifts = getPreviousMonthShifts(month, scheduleHistory);

  // Create all shifts for the month (only on active days)
  monthDays.forEach((day, dayIndex) => {
    const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Create shifts based on shiftStartTimes array
    rules.shiftStartTimes.forEach((shiftTime, shiftIndex) => {
      // Check if this specific shift type is active on this day
      const activeDays = shiftTime.activeDaysOfWeek || rules.activeDaysOfWeek;
      
      if (!activeDays[dayOfWeek]) {
        return; // Skip this shift on this day
      }
      
      shifts.push({
        id: `shift-${shiftIndex}-day-${dayIndex}`,
        date: day,
        type: 'DAY', // Keep for backwards compatibility but use shiftIndex for logic
        shiftIndex: shiftIndex,
        assignedNurses: [],
        requiredStaff: shiftTime.requiredStaff,
      });
    });
  });

  // Combine previous month and current month shifts for constraint checking
  const allShiftsForConstraints = [...previousMonthShifts, ...shifts];

  // Sort nurses by ID for consistency
  const sortedNurses = [...nurses].sort((a, b) => a.id.localeCompare(b.id));

  // Assign nurses to shifts using a greedy algorithm with fairness
  shifts.forEach(shift => {
    assignNursesToShift(shift, sortedNurses, allShiftsForConstraints, rules, month);
  });

  return {
    month,
    shifts,
    rules,
    nurses,
  };
};

/**
 * Get shifts from the previous month for constraint checking across month boundaries
 */
const getPreviousMonthShifts = (
  currentMonth: Date,
  scheduleHistory?: Map<string, Schedule>
): Shift[] => {
  if (!scheduleHistory) return [];

  const prevMonth = subMonths(currentMonth, 1);
  const monthKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;
  const prevSchedule = scheduleHistory.get(monthKey);

  if (!prevSchedule) return [];

  // Calculate maximum lookback needed based on shift minDaysOff constraints
  const maxMinDaysOff = Math.max(
    ...prevSchedule.rules.shiftStartTimes.map(s => s.minDaysOff),
    7 // Minimum 7 days lookback
  );

  // Only return shifts from the last few days of previous month
  const lastDayOfPrevMonth = endOfMonth(prevMonth);
  const cutoffDate = new Date(lastDayOfPrevMonth);
  cutoffDate.setDate(cutoffDate.getDate() - maxMinDaysOff);

  return prevSchedule.shifts.filter(shift => shift.date >= cutoffDate);
};

/**
 * Assign nurses to a single shift
 */
const assignNursesToShift = (
  shift: Shift,
  nurses: Nurse[],
  allShifts: Shift[],
  rules: ScheduleRules,
  month: Date
): void => {
  // Calculate target hours for the month based on active days
  const activeDaysCount = getMonthDays(month).filter(
    day => rules.activeDaysOfWeek[day.getDay()]
  ).length;
  const weeksInMonth = activeDaysCount / 7;
  const targetHoursForMonth = rules.targetHoursPerWeek * weeksInMonth;

  // Get recent shifts to check who worked together
  const recentShifts = getRecentShifts(allShifts, shift.date, 7); // Look back 7 days

  // Create a list of eligible nurses with their current hours and shift balance
  const eligibleNurses = nurses
    .map(nurse => {
      const nurseShifts = allShifts.filter(s => s.assignedNurses.includes(nurse.id));
      
      // Count shifts by shift index
      const shiftCounts = new Map<number, number>();
      nurseShifts.forEach(s => {
        const idx = s.shiftIndex ?? 0;
        shiftCounts.set(idx, (shiftCounts.get(idx) || 0) + 1);
      });
      
      const totalShifts = nurseShifts.length;
      const currentHours = totalShifts * rules.shiftDurationHours;
      const constraint = canAssignNurseToShift(nurse, shift, allShifts, rules);

      // Calculate balance score - prefer nurses who need more of this shift type
      let shiftTypeDeficit = 0;
      const currentShiftIndex = shift.shiftIndex ?? 0;
      
      if (totalShifts > 0 && rules.shiftStartTimes.length > 0) {
        // Calculate ideal distribution based on requiredStaff ratios
        const totalRequired = rules.shiftStartTimes.reduce((sum, st) => sum + st.requiredStaff, 0);
        const idealRatio = rules.shiftStartTimes[currentShiftIndex]?.requiredStaff / totalRequired;
        const currentCount = shiftCounts.get(currentShiftIndex) || 0;
        const currentRatio = currentCount / totalShifts;
        
        // Prioritize nurses who have done proportionally fewer of this shift type
        shiftTypeDeficit = (idealRatio - currentRatio) * 100;
      } else {
        // New nurses: give slight preference
        shiftTypeDeficit = 10;
      }

      return {
        nurse,
        currentHours,
        hoursDeficit: targetHoursForMonth - currentHours,
        totalShifts,
        shiftTypeDeficit,
        canAssign: constraint.canAssign,
        reason: constraint.reason,
      };
    })
    .filter(n => n.canAssign)
    // Sort by multiple factors for fairness
    .sort((a, b) => {
      // 1. Prioritize nurses with hours deficit (be more aggressive with balancing)
      const hoursDeficitDiff = b.hoursDeficit - a.hoursDeficit;
      if (Math.abs(hoursDeficitDiff) > 12) { // More than 1 shift difference (reduced from 24)
        return hoursDeficitDiff;
      }
      
      // 2. Balance shift types - this is important for variety!
      const shiftTypeDiff = b.shiftTypeDeficit - a.shiftTypeDeficit;
      if (Math.abs(shiftTypeDiff) > 3) { // Reduced threshold for more balanced shift distribution
        return shiftTypeDiff;
      }
      
      // 3. Prefer nurses with fewer total shifts
      if (a.totalShifts !== b.totalShifts) {
        return a.totalShifts - b.totalShifts;
      }
      
      // 4. Fallback to ID for consistency
      return a.nurse.id.localeCompare(b.nurse.id);
    });

  // Assign the required number of nurses with variety consideration
  const nursesToAssign = selectNursesWithVariety(
    eligibleNurses.map(n => n.nurse),
    shift.requiredStaff,
    recentShifts
  );
  
  shift.assignedNurses = nursesToAssign.map(n => n.id);
};

/**
 * Get recent shifts before a given date
 */
const getRecentShifts = (allShifts: Shift[], beforeDate: Date, days: number): Shift[] => {
  const cutoffDate = new Date(beforeDate);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return allShifts.filter(s => s.date >= cutoffDate && s.date < beforeDate);
};

/**
 * Select nurses with variety - avoid same combinations working together repeatedly
 */
const selectNursesWithVariety = (
  eligibleNurses: Nurse[],
  required: number,
  recentShifts: Shift[]
): Nurse[] => {
  if (eligibleNurses.length <= required) {
    return eligibleNurses;
  }

  const selected: Nurse[] = [];
  const remaining = [...eligibleNurses];

  // Calculate how often each pair of nurses has worked together recently
  const pairCounts = new Map<string, number>();
  
  recentShifts.forEach(shift => {
    const nurses = shift.assignedNurses;
    for (let i = 0; i < nurses.length; i++) {
      for (let j = i + 1; j < nurses.length; j++) {
        const pairKey = [nurses[i], nurses[j]].sort().join('-');
        pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
      }
    }
  });

  // Select first nurse (highest priority from sorted list)
  selected.push(remaining.shift()!);

  // Select remaining nurses, preferring those who haven't recently worked with already selected
  while (selected.length < required && remaining.length > 0) {
    let bestIndex = 0;
    let lowestPairScore = Infinity;

    // Find nurse with lowest "familiarity score" with already selected nurses
    remaining.forEach((nurse, index) => {
      let pairScore = 0;
      selected.forEach(selectedNurse => {
        const pairKey = [nurse.id, selectedNurse.id].sort().join('-');
        pairScore += pairCounts.get(pairKey) || 0;
      });

      // Prefer nurses who haven't worked with the selected group
      if (pairScore < lowestPairScore) {
        lowestPairScore = pairScore;
        bestIndex = index;
      }
    });

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
};

/**
 * Default schedule rules
 */
export const defaultRules: ScheduleRules = {
  activeDaysOfWeek: [true, true, true, true, true, true, true], // All days active
  targetHoursPerWeek: 36,
  shiftDurationHours: 12,
  shiftStartTimes: [
    { 
      label: 'Day Shift', 
      startTime: '07:00', 
      endTime: '19:00', 
      requiredStaff: 3,
      minDaysOff: 0,          // No required rest after day shift
      maxConsecutive: 4,       // Max 4 consecutive day shifts
      allowSameDayWith: []     // Cannot work another shift same day
    },
    { 
      label: 'Night Shift', 
      startTime: '19:00', 
      endTime: '07:00', 
      requiredStaff: 2,
      minDaysOff: 2,           // 2 days off required after night shift
      maxConsecutive: 0,        // Cannot work consecutive night shifts
      allowSameDayWith: []      // Cannot work another shift same day
    },
  ],
};
