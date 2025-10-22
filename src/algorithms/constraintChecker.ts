import type { Shift, Nurse, ScheduleRules } from '../types';
import { isSameDayHelper, addDaysHelper } from '../utils/dateHelpers';

export interface ConstraintCheckResult {
  canAssign: boolean;
  reason?: string;
}

/**
 * Check if a nurse can be assigned to a shift based on all constraints
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

  // Check if already assigned to another shift on the same day
  const shiftOnSameDay = allShifts.find(
    s => isSameDayHelper(s.date, shift.date) && 
         s.id !== shift.id && 
         s.assignedNurses.includes(nurse.id)
  );
  if (shiftOnSameDay) {
    // Check if same-day double shift is allowed via transition rules
    const fromIndex = shiftOnSameDay.shiftIndex;
    const toIndex = shift.shiftIndex;
    const transitionRule = rules.shiftTransitionRules?.find(
      r => r.fromShiftIndex === fromIndex && r.toShiftIndex === toIndex
    );
    
    if (!transitionRule?.sameDay) {
      return { 
        canAssign: false, 
        reason: `Same-day shifts not allowed: ${rules.shiftStartTimes[fromIndex]?.label || 'Shift ' + fromIndex} → ${rules.shiftStartTimes[toIndex]?.label || 'Shift ' + toIndex}` 
      };
    }
  }

  // Check transition rules for previous day shifts
  const previousDayDate = addDaysHelper(shift.date, -1);
  const previousDayShifts = allShifts.filter(s => 
    isSameDayHelper(s.date, previousDayDate) && 
    s.assignedNurses.includes(nurse.id)
  );

  for (const prevShift of previousDayShifts) {
    const fromIndex = prevShift.shiftIndex ?? 0;
    const toIndex = shift.shiftIndex ?? 0;
    const transitionRule = rules.shiftTransitionRules?.find(
      r => r.fromShiftIndex === fromIndex && r.toShiftIndex === toIndex
    );

    // If maxConsecutive is 0, consecutive shifts are not allowed
    if (transitionRule && transitionRule.maxConsecutive === 0) {
      return {
        canAssign: false,
        reason: `Consecutive shifts not allowed: ${rules.shiftStartTimes[fromIndex]?.label || 'Shift ' + fromIndex} → ${rules.shiftStartTimes[toIndex]?.label || 'Shift ' + toIndex}`,
      };
    }
  }

  // Check minimum days off requirements for ALL shift transition rules
  // This handles cases like: Night shift -> Day off -> Day off -> Day shift (with 2 day minimum)
  const currentShiftIndex = shift.shiftIndex ?? 0;
  
  // Find all applicable transition rules TO the current shift
  const applicableRules = rules.shiftTransitionRules?.filter(
    r => r.toShiftIndex === currentShiftIndex && r.minDaysOff > 0
  ) || [];

  for (const rule of applicableRules) {
    const fromShiftIndex = rule.fromShiftIndex;
    const minDays = rule.minDaysOff;

    // Look back through the minimum days off period
    for (let i = 1; i <= minDays; i++) {
      const checkDate = addDaysHelper(shift.date, -i);
      const hadShift = allShifts.some(s => 
        isSameDayHelper(s.date, checkDate) && 
        s.assignedNurses.includes(nurse.id) &&
        s.shiftIndex === fromShiftIndex
      );
      
      if (hadShift) {
        return {
          canAssign: false,
          reason: `Minimum ${minDays} day(s) off required after ${rules.shiftStartTimes[fromShiftIndex]?.label || 'Shift ' + fromShiftIndex} before ${rules.shiftStartTimes[currentShiftIndex]?.label || 'Shift ' + currentShiftIndex} (worked ${i} day(s) ago)`,
        };
      }
    }
  }

  // Check for consecutive shifts limit
  // First check if there's a specific maxConsecutive for this shift type
  const selfTransitionRule = rules.shiftTransitionRules?.find(
    r => r.fromShiftIndex === currentShiftIndex && r.toShiftIndex === currentShiftIndex
  );
  
  const maxConsecutiveForThisShift = selfTransitionRule?.maxConsecutive;
  
  // If maxConsecutive is > 0, enforce the limit
  if (maxConsecutiveForThisShift !== undefined && maxConsecutiveForThisShift > 0) {
    const consecutiveShifts = countConsecutiveShiftsEndingOn(
      addDaysHelper(shift.date, -1),
      nurse.id,
      allShifts,
      currentShiftIndex
    );

    if (consecutiveShifts >= maxConsecutiveForThisShift) {
      const shiftLabel = rules.shiftStartTimes[currentShiftIndex]?.label || 'Shift ' + currentShiftIndex;
      return {
        canAssign: false,
        reason: `Maximum ${maxConsecutiveForThisShift} consecutive ${shiftLabel} shifts reached`,
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
