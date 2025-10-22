import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addDays,
  differenceInDays,
  startOfWeek,
  differenceInWeeks,
} from 'date-fns';

export const getMonthDays = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

export const formatDate = (date: Date, formatStr: string = 'yyyy-MM-dd'): string => {
  return format(date, formatStr);
};

export const formatShiftTime = (type: 'DAY' | 'NIGHT'): string => {
  return type === 'DAY' ? '07:00-19:00' : '19:00-07:00';
};

export const isSameDayHelper = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const addDaysHelper = (date: Date, amount: number): Date => {
  return addDays(date, amount);
};

export const getDaysBetween = (date1: Date, date2: Date): number => {
  return differenceInDays(date2, date1);
};

export const getWeeksInMonth = (date: Date): number => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return differenceInWeeks(end, start) + 1;
};

export const getWeekNumber = (date: Date): number => {
  const start = startOfWeek(startOfMonth(date));
  return differenceInWeeks(date, start) + 1;
};
