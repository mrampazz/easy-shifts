export interface Nurse {
  id: string;
  name: string;
  email?: string;
  constraints?: NurseConstraint[];
}

export interface NurseConstraint {
  type: 'unavailable';
  date: Date;
  reason?: string;
}

export type ShiftType = 'DAY' | 'NIGHT';

export interface Shift {
  id: string;
  date: Date;
  type: ShiftType;
  shiftIndex: number; // Index into shiftStartTimes array
  assignedNurses: string[]; // nurse IDs
  requiredStaff: number;
}

export interface ShiftTime {
  label: string; // Full label (e.g., "Morning", "Afternoon", "Night", "On-call")
  abbreviation?: string; // Short label for calendar (e.g., "M", "A", "N") - defaults to first letter of label
  startTime: string; // e.g., "07:00"
  endTime: string; // e.g., "19:00"
  requiredStaff: number; // How many people needed for this shift
  dayAfterLabel?: string; // Optional label to show on the day AFTER this shift (e.g., "R" for recovery after night shift)
}

export interface ShiftTransitionRule {
  fromShiftIndex: number; // Index in shiftStartTimes array
  toShiftIndex: number; // Index in shiftStartTimes array
  sameDay: boolean; // Can they work both shifts on the same day?
  consecutive: boolean; // Can toShift start immediately after fromShift ends?
  minDaysOff?: number; // Minimum days off required between these shifts
  maxConsecutive?: number; // Maximum consecutive shifts of this type (overrides global maxConsecutiveShifts for this specific transition)
}

export interface ScheduleRules {
  activeDaysOfWeek: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  targetHoursPerWeek: number; // default: 36
  shiftDurationHours: number; // default: 12
  shiftStartTimes: ShiftTime[]; // Array of shift times
  shiftTransitionRules: ShiftTransitionRule[]; // Rules for shift transitions
  maxConsecutiveShifts: number; // default: 4
}

export interface Schedule {
  month: Date;
  shifts: Shift[];
  rules: ScheduleRules;
  nurses: Nurse[];
}

export interface NurseStats {
  nurseId: string;
  nurseName: string;
  totalShifts: number;
  dayShifts: number;
  nightShifts: number;
  totalHours: number;
  averageHoursPerWeek: number;
  consecutiveShiftStreak: number;
  daysWorked: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
