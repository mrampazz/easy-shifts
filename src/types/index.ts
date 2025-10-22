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
  label: string;
  abbreviation?: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  requiredStaff: number;
  dayAfterLabel?: string; // Optional label for day after shift (e.g., "R" for recovery)
  activeDaysOfWeek?: boolean[]; // Optional per-shift active days (falls back to global if undefined)
  
  // Simplified constraint model - all required
  minDaysOff: number; // Days off required AFTER working this shift (0 = no requirement)
  maxConsecutive: number; // Max times can work this shift consecutively (0 = not allowed consecutive)
  allowSameDayWith: number[]; // Array of shift indices that can be worked on same day (empty = no same-day combinations)
}

export interface ScheduleRules {
  activeDaysOfWeek: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  targetHoursPerWeek: number; // default: 36
  shiftDurationHours: number; // default: 12
  shiftStartTimes: ShiftTime[]; // Array of shift times
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
