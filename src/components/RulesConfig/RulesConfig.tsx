import React, { useState, useCallback, useEffect } from 'react';
import type { ScheduleRules, ShiftTime } from '../../types';
import { useSchedule } from '../../hooks/useSchedule';

interface RulesConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesConfig: React.FC<RulesConfigProps> = ({ isOpen, onClose }) => {
  const { rules, setRules, regenerateSchedule } = useSchedule();
  const [localRules, setLocalRules] = useState(rules);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonError, setJsonError] = useState('');

  // Sync local rules when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalRules(rules);
    }
  }, [isOpen, rules]);

  const handleChange = useCallback((key: keyof ScheduleRules, value: number | boolean | boolean[] | ShiftTime[]) => {
    setLocalRules(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    setRules(localRules);
    regenerateSchedule();
    onClose();
  }, [localRules, setRules, regenerateSchedule, onClose]);

  const handleCancel = useCallback(() => {
    setLocalRules(rules);
    onClose();
  }, [rules, onClose]);

  const handleAddShift = useCallback(() => {
    const newShift: ShiftTime = {
      label: 'New Shift',
      startTime: '08:00',
      endTime: '20:00',
      requiredStaff: 2,
      minDaysOff: 0,
      maxConsecutive: 5,
      allowSameDayWith: [],
    };
    handleChange('shiftStartTimes', [...localRules.shiftStartTimes, newShift]);
  }, [localRules.shiftStartTimes, handleChange]);

  const handleUpdateShift = useCallback((index: number, field: keyof ShiftTime, value: string | number | boolean[] | number[] | undefined) => {
    const updatedShifts = [...localRules.shiftStartTimes];
    
    if (value === undefined) {
      // Remove the field
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _, ...rest} = updatedShifts[index];
      updatedShifts[index] = rest as ShiftTime;
    } else {
      updatedShifts[index] = { ...updatedShifts[index], [field]: value };
    }
    
    handleChange('shiftStartTimes', updatedShifts);
  }, [localRules.shiftStartTimes, handleChange]);

  const handleDeleteShift = useCallback((index: number) => {
    if (localRules.shiftStartTimes.length <= 1) {
      alert('You must have at least one shift type!');
      return;
    }
    const updatedShifts = localRules.shiftStartTimes.filter((_, i) => i !== index);
    
    // Update allowSameDayWith arrays in remaining shifts to remove deleted index and adjust others
    const adjustedShifts = updatedShifts.map(shift => ({
      ...shift,
      allowSameDayWith: shift.allowSameDayWith
        .filter(idx => idx !== index) // Remove deleted index
        .map(idx => idx > index ? idx - 1 : idx) // Adjust indices
    }));
    
    handleChange('shiftStartTimes', adjustedShifts);
  }, [localRules.shiftStartTimes, handleChange]);

  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(localRules, null, 2);
    navigator.clipboard.writeText(json);
    alert('Rules copied to clipboard!');
  }, [localRules]);

  const handleImportJson = useCallback(() => {
    try {
      const imported = JSON.parse(jsonInput);
      // Convert activeDaysOfWeek if it's an object
      if (imported.activeDaysOfWeek && !Array.isArray(imported.activeDaysOfWeek)) {
        imported.activeDaysOfWeek = Object.values(imported.activeDaysOfWeek);
      }
      setLocalRules(imported as ScheduleRules);
      setJsonError('');
      setShowJsonImport(false);
      setJsonInput('');
      alert('Rules imported successfully!');
    } catch {
      setJsonError('Invalid JSON format');
    }
  }, [jsonInput]);

  const handleDayToggle = useCallback((dayIndex: number) => {
    const newDays = [...localRules.activeDaysOfWeek];
    newDays[dayIndex] = !newDays[dayIndex];
    handleChange('activeDaysOfWeek', newDays);
  }, [localRules.activeDaysOfWeek, handleChange]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }, [handleCancel]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed at top */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-800">Schedule Rules</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">{/* JSON Import/Export */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-gray-800 mb-2">Import/Export JSON</h3>
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleExportJson}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                📋 Copy Rules as JSON
              </button>
              <button
                onClick={() => setShowJsonImport(!showJsonImport)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                📥 {showJsonImport ? 'Hide' : 'Import from JSON'}
              </button>
            </div>
            
            {showJsonImport && (
              <div className="mt-3">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste JSON rules here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm h-32"
                />
                {jsonError && (
                  <p className="text-red-600 text-sm mt-1">{jsonError}</p>
                )}
                <button
                  onClick={handleImportJson}
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md w-full"
                >
                  Apply JSON Rules
                </button>
              </div>
            )}
          </div>
      
          {/* Active Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Days of Week
            </label>
            <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map((day, index) => (
              <button
                key={day}
                onClick={() => handleDayToggle(index)}
                className={`px-2 py-2 text-xs font-semibold rounded-md transition ${
                  localRules.activeDaysOfWeek[index]
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Hours per Week
            </label>
            <input
              type="number"
              value={localRules.targetHoursPerWeek}
              onChange={(e) => handleChange('targetHoursPerWeek', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift Duration (hours)
            </label>
            <input
              type="number"
              value={localRules.shiftDurationHours}
              onChange={(e) => handleChange('shiftDurationHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        {/* Shift Times */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Shift Times Configuration</h3>
          
          <div className="space-y-3">
            {localRules.shiftStartTimes.map((shiftTime, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-300 relative">
                {/* Delete button in top left */}
                <button
                  onClick={() => handleDeleteShift(index)}
                  className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-2 rounded"
                  title="Delete shift"
                >
                  🗑️
                </button>

                <div className="flex flex-col gap-3 pl-12">
                  {/* Shift Label */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Shift Name
                    </label>
                    <input
                      type="text"
                      value={shiftTime.label}
                      onChange={(e) => handleUpdateShift(index, 'label', e.target.value)}
                      placeholder="e.g., Day Shift, Night Shift, Morning"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-semibold"
                    />
                  </div>

                  {/* Calendar Abbreviation */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Calendar Label (optional)
                    </label>
                    <input
                      type="text"
                      value={shiftTime.abbreviation || ''}
                      onChange={(e) => handleUpdateShift(index, 'abbreviation', e.target.value)}
                      placeholder="e.g., D, N, M (defaults to first letter)"
                      maxLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={shiftTime.startTime}
                        onChange={(e) => handleUpdateShift(index, 'startTime', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={shiftTime.endTime}
                        onChange={(e) => handleUpdateShift(index, 'endTime', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Required Staff */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Required Staff
                    </label>
                    <input
                      type="number"
                      value={shiftTime.requiredStaff}
                      onChange={(e) => handleUpdateShift(index, 'requiredStaff', e.target.value)}
                      min="1"
                      placeholder="Number of staff needed"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  {/* Day After Label */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Day After Label (optional)
                    </label>
                    <input
                      type="text"
                      value={shiftTime.dayAfterLabel || ''}
                      onChange={(e) => handleUpdateShift(index, 'dayAfterLabel', e.target.value)}
                      placeholder="e.g., R for Recovery (shown on day after shift)"
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Useful for marking mandatory recovery days after night shifts
                    </p>
                  </div>

                  {/* Active Days for this Shift */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Active Days (optional - leave unchecked to use global)
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, dayIndex) => {
                        const isActive = shiftTime.activeDaysOfWeek?.[dayIndex] ?? null;
                        const globalActive = localRules.activeDaysOfWeek[dayIndex];
                        return (
                          <button
                            key={dayIndex}
                            type="button"
                            onClick={() => {
                              const currentDays = shiftTime.activeDaysOfWeek || null;
                              let newDays: boolean[] | undefined;
                              
                              if (currentDays === null) {
                                // First click: copy global and toggle this day
                                newDays = [...localRules.activeDaysOfWeek];
                                newDays[dayIndex] = !globalActive;
                              } else {
                                // Subsequent clicks: toggle this day
                                newDays = [...currentDays];
                                newDays[dayIndex] = !newDays[dayIndex];
                                
                                // If all days match global, set back to undefined
                                if (newDays.every((val, i) => val === localRules.activeDaysOfWeek[i])) {
                                  newDays = undefined;
                                }
                              }
                              
                              handleUpdateShift(index, 'activeDaysOfWeek', newDays);
                            }}
                            className={`px-2 py-1.5 text-xs font-semibold rounded transition ${
                              isActive === null
                                ? globalActive
                                  ? 'bg-gray-300 text-gray-700 border-2 border-dashed border-gray-400'
                                  : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                                : isActive
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                            title={
                              isActive === null
                                ? `Using global setting (${globalActive ? 'active' : 'inactive'})`
                                : isActive
                                ? 'Active for this shift'
                                : 'Inactive for this shift'
                            }
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Dashed border = using global days. Solid = shift-specific override.
                    </p>
                  </div>

                  {/* Shift Constraints */}
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Shift Constraints</h4>
                    
                    {/* Min Days Off */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min Days Off After This Shift
                      </label>
                      <input
                        type="number"
                        value={shiftTime.minDaysOff}
                        onChange={(e) => handleUpdateShift(index, 'minDaysOff', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Required rest days after working this shift (0 = no requirement)
                      </p>
                    </div>

                    {/* Max Consecutive */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Consecutive Times
                      </label>
                      <input
                        type="number"
                        value={shiftTime.maxConsecutive}
                        onChange={(e) => handleUpdateShift(index, 'maxConsecutive', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum consecutive times this shift can be worked (0 = not allowed consecutive)
                      </p>
                    </div>

                    {/* Allow Same Day With */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Allow Same-Day Double Shifts With:
                      </label>
                      <div className="space-y-2">
                        {localRules.shiftStartTimes.map((otherShift, otherIndex) => {
                          if (otherIndex === index) return null; // Don't show self
                          const isChecked = shiftTime.allowSameDayWith.includes(otherIndex);
                          return (
                            <label key={otherIndex} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const newAllowSameDayWith = e.target.checked
                                    ? [...shiftTime.allowSameDayWith, otherIndex].sort((a, b) => a - b)
                                    : shiftTime.allowSameDayWith.filter(i => i !== otherIndex);
                                  handleUpdateShift(index, 'allowSameDayWith', newAllowSameDayWith);
                                }}
                                className="h-4 w-4"
                              />
                              <span className="text-xs">
                                {otherShift.label} ({otherShift.startTime}-{otherShift.endTime})
                              </span>
                            </label>
                          );
                        })}
                        {localRules.shiftStartTimes.length === 1 && (
                          <p className="text-xs text-gray-500 italic">
                            Add another shift to enable same-day double shifts
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select shifts that can be worked on the same calendar day (e.g., morning + evening)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add Shift button at bottom of list */}
          <button
            onClick={handleAddShift}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-200"
          >
            + Add Shift
          </button>
        </div>
        </div>
        
        {/* Footer buttons - fixed at bottom */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-md transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
            >
              Save & Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
