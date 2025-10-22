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
      { 
        label: 'Day Shift', 
        abbreviation: 'D', 
        startTime: '07:00', 
        endTime: '19:00', 
        requiredStaff: 3,
        minDaysOff: 0,          // No required rest after day shift
        maxConsecutive: 2,       // Max 2 consecutive day shifts
        allowSameDayWith: []     // Cannot work another shift same day
      },
      { 
        label: 'Night Shift', 
        abbreviation: 'N', 
        startTime: '19:00', 
        endTime: '07:00', 
        requiredStaff: 2,
        dayAfterLabel: '->',
        minDaysOff: 2,           // 2 days off required after night shift
        maxConsecutive: 0,        // Cannot work consecutive night shifts
        allowSameDayWith: []      // Cannot work another shift same day
      },
    ],
  } as ScheduleRules,

  // Three-shift rotation (morning, afternoon, night)
  three_shift_rotation: {
    activeDaysOfWeek: [true, true, true, true, true, true, true],
    targetHoursPerWeek: 40,
    shiftDurationHours: 8,
    shiftStartTimes: [
      { 
        label: 'Morning', 
        startTime: '06:00', 
        endTime: '14:00', 
        requiredStaff: 2,
        minDaysOff: 0,           // No required rest after morning
        maxConsecutive: 5,        // Max 5 consecutive mornings
        allowSameDayWith: [1]     // Can work afternoon same day
      },
      { 
        label: 'Afternoon', 
        startTime: '14:00', 
        endTime: '22:00', 
        requiredStaff: 2,
        minDaysOff: 0,            // No required rest after afternoon
        maxConsecutive: 5,         // Max 5 consecutive afternoons
        allowSameDayWith: [2]      // Can work night same day
      },
      { 
        label: 'Night', 
        startTime: '22:00', 
        endTime: '06:00', 
        requiredStaff: 2,
        minDaysOff: 2,             // 2 days off required after night
        maxConsecutive: 0,          // Cannot work consecutive nights
        allowSameDayWith: []        // Cannot work another shift same day
      },
    ],
  } as ScheduleRules,

    // Weekday only shifts
  weekday_only: {
    activeDaysOfWeek: [true, true, true, true, true, false, false],
    targetHoursPerWeek: 40,
    shiftDurationHours: 8,
    shiftStartTimes: [
      { 
        label: 'Day Shift', 
        startTime: '09:00', 
        endTime: '17:00', 
        requiredStaff: 3,
        minDaysOff: 0,            // No required rest after day shift
        maxConsecutive: 5,         // Max 5 consecutive days
        allowSameDayWith: [1]      // Can work night shift same day (double)
      },
      { 
        label: 'Night Shift', 
        startTime: '17:00', 
        endTime: '01:00', 
        requiredStaff: 1,
        minDaysOff: 1,             // 1 day off required after night
        maxConsecutive: 5,          // Max 5 consecutive nights
        allowSameDayWith: []        // Cannot work another shift same day
      },
    ],
  } as ScheduleRules,

  // Flexible doubles (can work two shifts in one day)
  flexible_doubles: {
    activeDaysOfWeek: [true, true, true, true, true, true, true],
    targetHoursPerWeek: 40,
    shiftDurationHours: 8,
    shiftStartTimes: [
      { 
        label: 'Morning', 
        startTime: '07:00', 
        endTime: '15:00', 
        requiredStaff: 2,
        minDaysOff: 0,             // No required rest after morning
        maxConsecutive: 3,          // Max 3 consecutive mornings
        allowSameDayWith: [1]       // Can work evening same day (double shift)
      },
      { 
        label: 'Evening', 
        startTime: '15:00', 
        endTime: '23:00', 
        requiredStaff: 2,
        minDaysOff: 0,              // No required rest after evening
        maxConsecutive: 3,           // Max 3 consecutive evenings
        allowSameDayWith: []         // Cannot work another shift same day
      },
    ],
  } as ScheduleRules,
};

