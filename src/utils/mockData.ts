import type { Nurse, ScheduleRules } from '../types';

export const mockNurses: Nurse[] = [
  {
    id: '1',
    name: 'Emma Johnson',
    email: 'emma.johnson@hospital.com',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@hospital.com',
  },
  {
    id: '3',
    name: 'Sarah Williams',
    email: 'sarah.williams@hospital.com',
  },
  {
    id: '4',
    name: 'James Martinez',
    email: 'james.martinez@hospital.com',
  },
  {
    id: '5',
    name: 'Olivia Brown',
    email: 'olivia.brown@hospital.com',
  },
  {
    id: '6',
    name: 'David Garcia',
    email: 'david.garcia@hospital.com',
  },
  {
    id: '7',
    name: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@hospital.com',
  },
  {
    id: '8',
    name: 'Daniel Kim',
    email: 'daniel.kim@hospital.com',
  },
  {
    id: '9',
    name: 'Ava Patel',
    email: 'ava.patel@hospital.com',
  },
  {
    id: '10',
    name: 'Matthew Anderson',
    email: 'matthew.anderson@hospital.com',
  },
  {
    id: '11',
    name: 'Isabella Thompson',
    email: 'isabella.thompson@hospital.com',
  },
  {
    id: '12',
    name: 'Christopher Lee',
    email: 'christopher.lee@hospital.com',
  },
  {
    id: '13',
    name: 'Mia Wilson',
    email: 'mia.wilson@hospital.com',
  },
  {
    id: '14',
    name: 'Joshua Taylor',
    email: 'joshua.taylor@hospital.com',
  },
  {
    id: '15',
    name: 'Charlotte Davis',
    email: 'charlotte.davis@hospital.com',
  },
];

/**
 * Example shift configurations for different scenarios
 */
export const mockShiftConfigurations = {
  // Standard hospital day/night shifts
  hospital_standard: {
    activeDaysOfWeek: [true, true, true, true, true, true, true],
    targetHoursPerWeek: 36,
    shiftDurationHours: 12,
    shiftStartTimes: [
      { label: 'Day Shift', abbreviation: 'D', startTime: '07:00', endTime: '19:00', requiredStaff: 3 },
      { label: 'Night Shift', abbreviation: 'N', startTime: '19:00', endTime: '07:00', requiredStaff: 2, dayAfterLabel: '->' },
    ],
    shiftTransitionRules: [
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, consecutive: true, maxConsecutive: 2 },
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: false, consecutive: false },
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, consecutive: false, minDaysOff: 2 },
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, consecutive: false, minDaysOff: 2 },
    ],
    maxConsecutiveShifts: 4,
  } as ScheduleRules,

  // Three-shift rotation (morning, afternoon, night)
  three_shift_rotation: {
    activeDaysOfWeek: [true, true, true, true, true, true, true],
    targetHoursPerWeek: 40,
    shiftDurationHours: 8,
    shiftStartTimes: [
      { label: 'Morning', startTime: '06:00', endTime: '14:00', requiredStaff: 2 },
      { label: 'Afternoon', startTime: '14:00', endTime: '22:00', requiredStaff: 2 },
      { label: 'Night', startTime: '22:00', endTime: '06:00', requiredStaff: 2 },
    ],
    shiftTransitionRules: [
      // Morning to Morning
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, consecutive: true },
      // Morning to Afternoon
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: false, consecutive: true },
      // Morning to Night
      { fromShiftIndex: 0, toShiftIndex: 2, sameDay: false, consecutive: false, minDaysOff: 1 },
      // Afternoon to Morning
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, consecutive: false, minDaysOff: 1 },
      // Afternoon to Afternoon
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, consecutive: true },
      // Afternoon to Night
      { fromShiftIndex: 1, toShiftIndex: 2, sameDay: false, consecutive: true },
      // Night to Morning
      { fromShiftIndex: 2, toShiftIndex: 0, sameDay: false, consecutive: false, minDaysOff: 2 },
      // Night to Afternoon
      { fromShiftIndex: 2, toShiftIndex: 1, sameDay: false, consecutive: false, minDaysOff: 2 },
      // Night to Night
      { fromShiftIndex: 2, toShiftIndex: 2, sameDay: false, consecutive: false, minDaysOff: 2 },
    ],
    maxConsecutiveShifts: 5,
  } as ScheduleRules,

  // Weekday only (Monday-Friday)
  weekday_only: {
    activeDaysOfWeek: [false, true, true, true, true, true, false], // Mon-Fri only
    targetHoursPerWeek: 40,
    shiftDurationHours: 10,
    shiftStartTimes: [
      { label: 'Day', startTime: '08:00', endTime: '18:00', requiredStaff: 3 },
      { label: 'Night', startTime: '18:00', endTime: '04:00', requiredStaff: 2 },
    ],
    shiftTransitionRules: [
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, consecutive: true },
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: false, consecutive: false },
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, consecutive: false, minDaysOff: 1 },
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, consecutive: false, minDaysOff: 1 },
    ],
    maxConsecutiveShifts: 5,
  } as ScheduleRules,

  // Flexible retail/restaurant (allowing doubles)
  flexible_doubles: {
    activeDaysOfWeek: [true, true, true, true, true, true, true],
    targetHoursPerWeek: 35,
    shiftDurationHours: 6,
    shiftStartTimes: [
      { label: 'Opening', startTime: '09:00', endTime: '15:00', requiredStaff: 2 },
      { label: 'Closing', startTime: '15:00', endTime: '21:00', requiredStaff: 2 },
    ],
    shiftTransitionRules: [
      // Opening to Opening
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, consecutive: true },
      // Opening to Closing (same day double allowed)
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: true, consecutive: true },
      // Closing to Opening (next day allowed)
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, consecutive: true },
      // Closing to Closing
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, consecutive: true },
    ],
    maxConsecutiveShifts: 6,
  } as ScheduleRules,
};

