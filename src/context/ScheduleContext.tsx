import React, { createContext, useState, useCallback } from 'react';
import type { Schedule, Nurse, ScheduleRules } from '../types';
import { generateSchedule } from '../algorithms/scheduleGenerator';
import { mockNurses, mockShiftConfigurations } from '../utils/mockData';

interface ScheduleContextType {
  schedule: Schedule | null;
  nurses: Nurse[];
  rules: ScheduleRules;
  currentMonth: Date;
  scheduleHistory: Map<string, Schedule>; // Store schedules by month key
  setCurrentMonth: (month: Date) => void;
  setRules: (rules: ScheduleRules) => void;
  setNurses: (nurses: Nurse[]) => void;
  regenerateSchedule: () => void;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nurses, setNurses] = useState<Nurse[]>(mockNurses);
  const [rules, setRules] = useState<ScheduleRules>(mockShiftConfigurations.hospital_standard);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [scheduleHistory, setScheduleHistory] = useState<Map<string, Schedule>>(new Map());
  const [rulesVersion, setRulesVersion] = useState(0); // Track when rules change

  const handleSetRules = useCallback((newRules: ScheduleRules) => {
    setRules(newRules);
    setRulesVersion(v => v + 1);
  }, []);

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  // Generate initial schedule only once
  const [isInitialized, setIsInitialized] = React.useState(false);

  const regenerateSchedule = useCallback(() => {
    // Don't clear history - we need it for cross-month constraint checking
    // Only regenerate the current month
    const newSchedule = generateSchedule(currentMonth, nurses, rules, scheduleHistory);
    setSchedule(newSchedule);
    
    // Update history with new schedule for current month
    const newHistory = new Map(scheduleHistory);
    newHistory.set(getMonthKey(currentMonth), newSchedule);
    setScheduleHistory(newHistory);
  }, [currentMonth, nurses, rules, scheduleHistory]);

  // Clear history when rules change (rules change means we need fresh schedules)
  React.useEffect(() => {
    if (isInitialized) {
      // Rules changed, clear ALL history and regenerate current month with fresh start
      setScheduleHistory(new Map());
      const newSchedule = generateSchedule(currentMonth, nurses, rules, new Map());
      setSchedule(newSchedule);
      setScheduleHistory(new Map([[getMonthKey(currentMonth), newSchedule]]));
    }
  }, [rulesVersion, isInitialized, currentMonth, nurses, rules]);

  React.useEffect(() => {
    if (!isInitialized) {
      regenerateSchedule();
      setIsInitialized(true);
    }
  }, [isInitialized, regenerateSchedule]);

  // When month changes, load from history or generate new
  React.useEffect(() => {
    if (!isInitialized) return; // Skip until initialized
    
    const monthKey = getMonthKey(currentMonth);
    const existingSchedule = scheduleHistory.get(monthKey);
    
    if (existingSchedule) {
      setSchedule(existingSchedule);
    } else {
      regenerateSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, isInitialized]);

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        nurses,
        rules,
        currentMonth,
        scheduleHistory,
        setCurrentMonth,
        setRules: handleSetRules,
        setNurses,
        regenerateSchedule,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
