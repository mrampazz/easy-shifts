import type { Shift, Nurse, ScheduleRules } from '../types';
import { isSameDayHelper, addDaysHelper } from '../utils/dateHelpers';

export interface ConstraintCheckResult {
  canAssign: boolean;
  reason?: string;
}

/**
 * Check if a nurse can be assigned to a shift based on all constraints
 * Uses the simplified per-shift constraint model
 */
export const canAssignNurseToShift = (
  nurse: Nurse,
  shift: Shift,
  allShifts: Shift[],
  rules: ScheduleRules
): ConstraintCheckResult => {
  // Check if nurse is unavailable on this date
  if (nurse.constraints) {
    const isUnavailable = nurse.constraints.some(constraint =>
      constraint.type === 'unavailable' && isSameDayHelper(constraint.date, shift.date)
    );
    if (isUnavailable) {
      return { canAssign: false, reason: 'Nurse is unavailable on this date' };
    }
  }

  // Check if already assigned to this shift
  if (shift.assignedNurses.includes(nurse.id)) {
    return { canAssign: false, reason: 'Already assigned to this shift' };
  }

  const currentShiftIndex = shift.shiftIndex ?? 0;
  const currentShiftConfig = rules.shiftStartTimes[currentShiftIndex];
  
  if (!currentShiftConfig) {
    return { canAssign: false, reason: 'Invalid shift configuration' };
  }

  // Check if already assigned to another shift on the same day
  const shiftOnSameDay = allShifts.find(
    s => isSameDayHelper(s.date, shift.date) && 
         s.id !== shift.id && 
         s.assignedNurses.includes(nurse.id)
  );
  
  if (shiftOnSameDay) {
    const existingShiftIndex = shiftOnSameDay.shiftIndex ?? 0;
    const existingShiftConfig = rules.shiftStartTimes[existingShiftIndex];
    
    // Check if the existing shift allows same-day work with the current shift
    if (!existingShiftConfig?.allowSameDayWith.includes(currentShiftIndex)) {
      return { 
        canAssign: false, 
        reason: `Same-day shifts not allowed: ${existingShiftConfig?.label || 'Shift ' + existingShiftIndex} → ${currentShiftConfig.label}` 
      };
    }
  }

  // Check minimum days off requirement after any shift type
  for (let shiftIndex = 0; shiftIndex < rules.shiftStartTimes.length; shiftIndex++) {
    const prevShiftConfig = rules.shiftStartTimes[shiftIndex];
    const minDays = prevShiftConfig.minDaysOff;

    if (minDays > 0) {
      // Look back through the minimum days off period
      for (let i = 1; i <= minDays; i++) {
        const checkDate = addDaysHelper(shift.date, -i);
        const hadThisShiftType = allShifts.some(s => 
          isSameDayHelper(s.date, checkDate) && 
          s.assignedNurses.includes(nurse.id) &&
          s.shiftIndex === shiftIndex
        );
        
        if (hadThisShiftType) {
          return {
            canAssign: false,
            reason: `Minimum ${minDays} day(s) off required after ${prevShiftConfig.label} (worked ${i} day(s) ago)`,
          };
        }
      }
    }
  }

  // Check for consecutive shifts of the same type
  if (currentShiftConfig.maxConsecutive === 0) {
    // Not allowed to work this shift type consecutively
    const previousDayDate = addDaysHelper(shift.date, -1);
    const hadSameShiftYesterday = allShifts.some(s =>
      isSameDayHelper(s.date, previousDayDate) &&
      s.assignedNurses.includes(nurse.id) &&
      s.shiftIndex === currentShiftIndex
    );

    if (hadSameShiftYesterday) {
      return {
        canAssign: false,
        reason: `Consecutive ${currentShiftConfig.label} shifts not allowed`,
      };
    }
  } else if (currentShiftConfig.maxConsecutive > 0) {
    // Check if we've reached the consecutive limit
    const consecutiveCount = countConsecutiveShiftsEndingOn(
      addDaysHelper(shift.date, -1),
      nurse.id,
      allShifts,
      currentShiftIndex
    );

    if (consecutiveCount >= currentShiftConfig.maxConsecutive) {
      return {
        canAssign: false,
        reason: `Maximum ${currentShiftConfig.maxConsecutive} consecutive ${currentShiftConfig.label} shifts reached`,
      };
    }
  }

  return { canAssign: true };
};

/**
 * Count consecutive shifts ending on a specific date
 * If shiftIndex is provided, only count consecutive shifts of that specific type
 */
const countConsecutiveShiftsEndingOn = (
  endDate: Date,
  nurseId: string,
  allShifts: Shift[],
  shiftIndex?: number
): number => {
  let count = 0;
  let currentDate = new Date(endDate);

  while (true) {
    const shift = allShifts.find(
      s => isSameDayHelper(s.date, currentDate) && 
           s.assignedNurses.includes(nurseId) &&
           (shiftIndex === undefined || s.shiftIndex === shiftIndex)
    );

    if (!shift) break;

    count++;
    currentDate = addDaysHelper(currentDate, -1);
  }

  return count;
};

/**
 * Calculate how many hours a nurse has worked in the current schedule
 */
export const calculateNurseHours = (
  nurseId: string,
  shifts: Shift[],
  shiftDurationHours: number
): number => {
  const nurseShifts = shifts.filter(s => s.assignedNurses.includes(nurseId));
  return nurseShifts.length * shiftDurationHours;
};
