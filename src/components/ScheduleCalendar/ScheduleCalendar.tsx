import React, { useState } from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import { format, addMonths, subMonths } from 'date-fns';
import { getMonthDays } from '../../utils/dateHelpers';
import { calculateNurseStats } from '../../utils/statistics';
import { generateSchedulePDF } from '../../utils/pdfGenerator';

export const ScheduleCalendar: React.FC = () => {
  const { schedule, currentMonth, setCurrentMonth, regenerateSchedule, nurses, setNurses, scheduleHistory } = useSchedule();
  const [editMode, setEditMode] = useState(false);

  if (!schedule) {
    return <div>Loading...</div>;
  }

  const monthDays = getMonthDays(currentMonth);

  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const toggleUnavailable = (nurseId: string, day: Date) => {
    if (!editMode) return;

    const updatedNurses = nurses.map(nurse => {
      if (nurse.id !== nurseId) return nurse;

      const constraints = nurse.constraints || [];
      const existingIndex = constraints.findIndex(
        c => c.type === 'unavailable' && c.date.toDateString() === day.toDateString()
      );

      if (existingIndex >= 0) {
        // Remove constraint
        return {
          ...nurse,
          constraints: constraints.filter((_, i) => i !== existingIndex),
        };
      } else {
        // Add constraint
        return {
          ...nurse,
          constraints: [...constraints, { type: 'unavailable' as const, date: day }],
        };
      }
    });

    setNurses(updatedNurses);
    
    // Auto-regenerate after marking unavailable
    setTimeout(() => {
      regenerateSchedule();
    }, 100);
  };

  const isNurseUnavailable = (nurseId: string, day: Date): boolean => {
    const nurse = nurses.find(n => n.id === nurseId);
    if (!nurse?.constraints) return false;
    return nurse.constraints.some(
      c => c.type === 'unavailable' && c.date.toDateString() === day.toDateString()
    );
  };

  // Get shifts for each nurse on each day
  const getNurseShiftsForDay = (nurseId: string, day: Date) => {
    return schedule.shifts.filter(
      s => s.date.toDateString() === day.toDateString() && 
           s.assignedNurses.includes(nurseId)
    );
  };

  // Generate a consistent color for each shift index
  const getShiftColor = (shiftIndex: number) => {
    const colors = [
      { bg: 'bg-yellow-200', text: 'text-yellow-900', hover: 'hover:bg-yellow-300' },
      { bg: 'bg-blue-200', text: 'text-blue-900', hover: 'hover:bg-blue-300' },
      { bg: 'bg-purple-200', text: 'text-purple-900', hover: 'hover:bg-purple-300' },
      { bg: 'bg-green-200', text: 'text-green-900', hover: 'hover:bg-green-300' },
      { bg: 'bg-pink-200', text: 'text-pink-900', hover: 'hover:bg-pink-300' },
      { bg: 'bg-indigo-200', text: 'text-indigo-900', hover: 'hover:bg-indigo-300' },
      { bg: 'bg-orange-200', text: 'text-orange-900', hover: 'hover:bg-orange-300' },
      { bg: 'bg-teal-200', text: 'text-teal-900', hover: 'hover:bg-teal-300' },
    ];
    return colors[shiftIndex % colors.length];
  };

  // Get abbreviation or first letter of shift label
  const getShiftLabel = (shiftIndex: number) => {
    const shiftTime = schedule.rules.shiftStartTimes[shiftIndex];
    if (!shiftTime) return shiftIndex.toString();
    
    // Use abbreviation if provided, otherwise first letter of label
    return shiftTime.abbreviation || shiftTime.label?.charAt(0).toUpperCase() || shiftIndex.toString();
  };

  // Get day-after label for a shift
  const getDayAfterLabel = (nurseId: string, day: Date): string | null => {
    const previousDay = new Date(day);
    previousDay.setDate(previousDay.getDate() - 1);
    
    // First check current month's shifts
    let previousDayShifts = schedule.shifts.filter(
      s => s.date.toDateString() === previousDay.toDateString() && 
           s.assignedNurses.includes(nurseId)
    );

    // If previous day is not in current month, check schedule history
    if (previousDayShifts.length === 0 && previousDay.getMonth() !== day.getMonth()) {
      const prevMonthKey = `${previousDay.getFullYear()}-${previousDay.getMonth()}`;
      const prevMonthSchedule = scheduleHistory.get(prevMonthKey);
      
      if (prevMonthSchedule) {
        previousDayShifts = prevMonthSchedule.shifts.filter(
          s => s.date.toDateString() === previousDay.toDateString() && 
               s.assignedNurses.includes(nurseId)
        );
      }
    }

    for (const shift of previousDayShifts) {
      const shiftTime = schedule.rules.shiftStartTimes[shift.shiftIndex ?? 0];
      if (shiftTime?.dayAfterLabel) {
        return shiftTime.dayAfterLabel;
      }
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold"
        >
          ← Prev
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-semibold"
        >
          Next →
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex-1 font-semibold py-2 px-4 rounded-md transition ${
            editMode
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          {editMode ? '✏️ Editing Unavailability' : '📅 Mark Unavailable Days'}
        </button>
        <button
          onClick={regenerateSchedule}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Regenerate Schedule
        </button>
        <button
          onClick={() => generateSchedulePDF(schedule)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          📄 Export PDF
        </button>
      </div>

      {editMode && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-300 rounded-md text-sm">
          <p className="font-semibold text-orange-900">✏️ Edit Mode Active</p>
          <p className="text-orange-800 mt-1">
            Click on any day cell to mark a nurse as unavailable (sick/holiday). 
            Click again to remove. Then regenerate the schedule.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Calendar Legend</h3>
        <div className="flex flex-col gap-2 text-sm">
          {/* Shift types */}
          {schedule.rules.shiftStartTimes.map((shiftTime, index) => {
            const colors = getShiftColor(index);
            return (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-10 h-7 ${colors.bg} border border-gray-400 rounded flex items-center justify-center font-bold text-xs ${colors.text} flex-shrink-0`}>
                  {getShiftLabel(index)}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{shiftTime.label}</span>
                  <span className="text-xs text-gray-500">
                    ({shiftTime.startTime} - {shiftTime.endTime})
                  </span>
                  {shiftTime.dayAfterLabel && (
                    <span className="text-xs bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                      Next day: <span className="font-bold">{shiftTime.dayAfterLabel}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Other states */}
          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-7 bg-gray-100 border border-gray-300 rounded flex items-center justify-center text-gray-400 font-bold text-xs flex-shrink-0">-</div>
            <span className="text-gray-600">Day Off</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-red-100 border-2 border-red-400 rounded flex items-center justify-center text-red-900 font-bold text-xs flex-shrink-0">✕</div>
            <span className="text-gray-600">Unavailable (sick/holiday)</span>
          </div>
        </div>
      </div>

      {/* Shift Calendar Table - Main Focus */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700 min-w-[150px] z-10">
                Nurse
              </th>
              {monthDays.map((day) => (
                <th 
                  key={day.toISOString()} 
                  className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-700 min-w-[35px]"
                >
                  <div className="text-[10px]">{format(day, 'EEE')}</div>
                  <div className="font-bold text-sm">{format(day, 'd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.nurses.map((nurse) => {
              return (
                <tr key={nurse.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 z-10">
                    {nurse.name}
                  </td>
                  {monthDays.map((day) => {
                    const shifts = getNurseShiftsForDay(nurse.id, day);
                    const unavailable = isNurseUnavailable(nurse.id, day);
                    const dayAfterLabel = getDayAfterLabel(nurse.id, day);
                    
                    let cellClass = 'border border-gray-300 px-1 py-3 text-center text-xs font-bold';
                    let content = '';
                    
                    if (unavailable) {
                      cellClass += ' bg-red-100 border-2 border-red-400 text-red-900';
                      content = '✕';
                      if (editMode) {
                        cellClass += ' cursor-pointer hover:bg-red-200';
                      }
                    } else if (shifts.length > 1) {
                      // Multiple shifts on same day
                      cellClass += ' bg-red-200 text-red-900';
                      content = shifts.map(s => getShiftLabel(s.shiftIndex ?? 0)).join('');
                      if (editMode) {
                        cellClass += ' cursor-pointer hover:bg-red-300';
                      }
                    } else if (shifts.length === 1) {
                      const shift = shifts[0];
                      const shiftIndex = shift.shiftIndex ?? 0;
                      const colors = getShiftColor(shiftIndex);
                      cellClass += ` ${colors.bg} ${colors.text}`;
                      content = getShiftLabel(shiftIndex);
                      if (editMode) {
                        cellClass += ` ${colors.hover}`;
                      }
                    } else if (dayAfterLabel) {
                      // No shift today, but show day-after label from previous day's shift
                      cellClass += ' bg-gray-50 text-amber-900 font-bold';
                      content = dayAfterLabel;
                      if (editMode) {
                        cellClass += ' cursor-pointer hover:bg-gray-200';
                      }
                    } else {
                      cellClass += ' bg-gray-50 text-gray-400';
                      content = '-';
                      if (editMode) {
                        cellClass += ' cursor-pointer hover:bg-gray-200';
                      }
                    }
                    
                    return (
                      <td 
                        key={day.toISOString()} 
                        className={cellClass}
                        onClick={() => toggleUnavailable(nurse.id, day)}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Statistics Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Nurse Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-gray-100 border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-700">
                  Nurse
                </th>
                <th className="bg-gray-100 border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-700">
                  Total Shifts
                </th>
                {schedule.rules.shiftStartTimes.map((shiftTime, index) => (
                  <th key={index} className="bg-gray-100 border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-700">
                    {shiftTime.label}
                  </th>
                ))}
                <th className="bg-gray-100 border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-700">
                  Total Hours
                </th>
                <th className="bg-gray-100 border border-gray-300 px-2 py-2 text-center text-sm font-semibold text-gray-700">
                  Avg Hrs/Week
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.nurses.map((nurse) => {
                const stats = calculateNurseStats(nurse, schedule.shifts, schedule.rules, schedule.month);
                const isBalanced = Math.abs(stats.averageHoursPerWeek - schedule.rules.targetHoursPerWeek) < 2;
                
                // Count shifts by index for this nurse
                const nurseShifts = schedule.shifts.filter(s => s.assignedNurses.includes(nurse.id));
                const shiftCounts = new Map<number, number>();
                nurseShifts.forEach(s => {
                  const idx = s.shiftIndex ?? 0;
                  shiftCounts.set(idx, (shiftCounts.get(idx) || 0) + 1);
                });
                
                return (
                  <tr key={nurse.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
                      {nurse.name}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm font-semibold">
                      {stats.totalShifts}
                    </td>
                    {schedule.rules.shiftStartTimes.map((_, index) => {
                      const colors = getShiftColor(index);
                      const count = shiftCounts.get(index) || 0;
                      return (
                        <td key={index} className="border border-gray-300 px-2 py-2 text-center text-sm">
                          <span className={`font-semibold ${colors.text}`}>{count}</span>
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-2 py-2 text-center text-sm font-semibold">
                      {stats.totalHours}
                    </td>
                    <td className={`border border-gray-300 px-2 py-2 text-center text-sm font-bold ${
                      isBalanced ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.averageHoursPerWeek.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-gray-700 mb-2">Schedule Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Staff:</span>{' '}
            <span className="font-semibold">{schedule.nurses.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Days in Month:</span>{' '}
            <span className="font-semibold">{monthDays.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Shift Types:</span>{' '}
            <span className="font-semibold">{schedule.rules.shiftStartTimes.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Target Hrs/Wk:</span>{' '}
            <span className="font-semibold">{schedule.rules.targetHoursPerWeek}h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
