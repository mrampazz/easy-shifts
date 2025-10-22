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
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, minDaysOff: 0, maxConsecutive: 2 }, // Day to Day: up to 2 consecutive
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: false, minDaysOff: 0, maxConsecutive: 0 }, // Day to Night: not allowed consecutive
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, minDaysOff: 2, maxConsecutive: 0 }, // Night to Day: 2 days off required, not consecutive
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, minDaysOff: 2, maxConsecutive: 0 }, // Night to Night: 2 days off required, not consecutive
    ],
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
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, minDaysOff: 0, maxConsecutive: 5 },
      // Morning to Afternoon
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: false, minDaysOff: 0, maxConsecutive: 1 },
      // Morning to Night
      { fromShiftIndex: 0, toShiftIndex: 2, sameDay: false, minDaysOff: 1, maxConsecutive: 0 },
      // Afternoon to Morning
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, minDaysOff: 1, maxConsecutive: 0 },
      // Afternoon to Afternoon
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, minDaysOff: 0, maxConsecutive: 5 },
      // Afternoon to Night
      { fromShiftIndex: 1, toShiftIndex: 2, sameDay: false, minDaysOff: 0, maxConsecutive: 1 },
      // Night to Morning
      { fromShiftIndex: 2, toShiftIndex: 0, sameDay: false, minDaysOff: 2, maxConsecutive: 0 },
      // Night to Afternoon
      { fromShiftIndex: 2, toShiftIndex: 1, sameDay: false, minDaysOff: 2, maxConsecutive: 0 },
      // Night to Night
      { fromShiftIndex: 2, toShiftIndex: 2, sameDay: false, minDaysOff: 2, maxConsecutive: 0 },
    ],
  } as ScheduleRules,

    // Weekday only shifts
  weekday_only: {
    activeDaysOfWeek: [true, true, true, true, true, false, false],
    targetHoursPerWeek: 40,
    shiftDurationHours: 8,
    shiftStartTimes: [
      { label: 'Day Shift', startTime: '09:00', endTime: '17:00', requiredStaff: 3 },
      { label: 'Night Shift', startTime: '17:00', endTime: '01:00', requiredStaff: 1 },
    ],
    shiftTransitionRules: [
      // Day to Day
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, minDaysOff: 0, maxConsecutive: 5 },
      // Day to Night - can work same day (double shift)
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: true, minDaysOff: 0, maxConsecutive: 2 },
      // Night to Day
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, minDaysOff: 1, maxConsecutive: 0 },
      // Night to Night
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, minDaysOff: 0, maxConsecutive: 5 },
    ],
  } as ScheduleRules,

  // Flexible doubles (can work two shifts in one day)
  flexible_doubles: {
    activeDaysOfWeek: [true, true, true, true, true, true, true],
    targetHoursPerWeek: 40,
    shiftDurationHours: 8,
    shiftStartTimes: [
      { label: 'Morning', startTime: '07:00', endTime: '15:00', requiredStaff: 2 },
      { label: 'Evening', startTime: '15:00', endTime: '23:00', requiredStaff: 2 },
    ],
    shiftTransitionRules: [
      // Morning to Morning
      { fromShiftIndex: 0, toShiftIndex: 0, sameDay: false, minDaysOff: 0, maxConsecutive: 3 },
      // Morning to Evening - Allow doubles
      { fromShiftIndex: 0, toShiftIndex: 1, sameDay: true, minDaysOff: 0, maxConsecutive: 2 },
      // Evening to Morning - not allowed consecutive
      { fromShiftIndex: 1, toShiftIndex: 0, sameDay: false, minDaysOff: 0, maxConsecutive: 0 },
      // Evening to Evening
      { fromShiftIndex: 1, toShiftIndex: 1, sameDay: false, minDaysOff: 0, maxConsecutive: 3 },
    ],
  } as ScheduleRules,
};

