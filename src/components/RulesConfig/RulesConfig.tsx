import React, { useState } from 'react';
import type { ScheduleRules, ShiftTime, ShiftTransitionRule } from '../../types';
import { useSchedule } from '../../hooks/useSchedule';

interface RulesConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesConfig: React.FC<RulesConfigProps> = ({ isOpen, onClose }) => {
  const { rules, setRules, regenerateSchedule } = useSchedule();
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonError, setJsonError] = useState('');

  if (!isOpen) return null;

  const handleChange = (key: keyof ScheduleRules, value: number | boolean | boolean[] | ShiftTime[] | ShiftTransitionRule[]) => {
    setRules({ ...rules, [key]: value });
  };

  const handleAddShift = () => {
    const newShift: ShiftTime = {
      label: 'New Shift',
      startTime: '08:00',
      endTime: '20:00',
      requiredStaff: 2,
    };
    handleChange('shiftStartTimes', [...rules.shiftStartTimes, newShift]);
  };

  const handleUpdateShift = (index: number, field: keyof ShiftTime, value: string) => {
    const updatedShifts = [...rules.shiftStartTimes];
    updatedShifts[index] = { ...updatedShifts[index], [field]: value };
    handleChange('shiftStartTimes', updatedShifts);
  };

  const handleDeleteShift = (index: number) => {
    if (rules.shiftStartTimes.length <= 1) {
      alert('You must have at least one shift type!');
      return;
    }
    const updatedShifts = rules.shiftStartTimes.filter((_, i) => i !== index);
    handleChange('shiftStartTimes', updatedShifts);
    
    // Remove any transition rules involving this shift
    const updatedRules = (rules.shiftTransitionRules || []).filter(
      rule => rule.fromShiftIndex !== index && rule.toShiftIndex !== index
    ).map(rule => ({
      ...rule,
      fromShiftIndex: rule.fromShiftIndex > index ? rule.fromShiftIndex - 1 : rule.fromShiftIndex,
      toShiftIndex: rule.toShiftIndex > index ? rule.toShiftIndex - 1 : rule.toShiftIndex,
    }));
    handleChange('shiftTransitionRules', updatedRules);
  };

  const handleUpdateTransitionRule = (fromIndex: number, toIndex: number, field: keyof ShiftTransitionRule, value: boolean | number | undefined) => {
    const currentRules = rules.shiftTransitionRules || [];
    const ruleIndex = currentRules.findIndex(
      r => r.fromShiftIndex === fromIndex && r.toShiftIndex === toIndex
    );
    
    if (ruleIndex >= 0) {
      const updatedRules = [...currentRules];
      if (value === undefined) {
        // Remove the field from the rule
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [field]: _, ...rest } = updatedRules[ruleIndex];
        updatedRules[ruleIndex] = rest as ShiftTransitionRule;
      } else {
        updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], [field]: value };
      }
      handleChange('shiftTransitionRules', updatedRules);
    } else {
      // Create new rule
      const newRule: ShiftTransitionRule = {
        fromShiftIndex: fromIndex,
        toShiftIndex: toIndex,
        sameDay: field === 'sameDay' ? value as boolean : false,
        consecutive: field === 'consecutive' ? value as boolean : false,
        ...(field === 'minDaysOff' && typeof value === 'number' && { minDaysOff: value }),
        ...(field === 'maxConsecutive' && typeof value === 'number' && { maxConsecutive: value }),
      };
      handleChange('shiftTransitionRules', [...currentRules, newRule]);
    }
  };

  const getTransitionRule = (fromIndex: number, toIndex: number): ShiftTransitionRule => {
    const rule = (rules.shiftTransitionRules || []).find(
      r => r.fromShiftIndex === fromIndex && r.toShiftIndex === toIndex
    );
    return rule || { fromShiftIndex: fromIndex, toShiftIndex: toIndex, sameDay: false, consecutive: false };
  };

  const getShiftLabel = (index: number) => {
    const shift = rules.shiftStartTimes[index];
    return `${shift.label} (${shift.startTime}-${shift.endTime})`;
  };

  const handleExportJson = () => {
    const json = JSON.stringify(rules, null, 2);
    navigator.clipboard.writeText(json);
    alert('Rules copied to clipboard!');
  };

  const handleImportJson = () => {
    try {
      const imported = JSON.parse(jsonInput);
      // Convert activeDaysOfWeek if it's an object
      if (imported.activeDaysOfWeek && !Array.isArray(imported.activeDaysOfWeek)) {
        imported.activeDaysOfWeek = Object.values(imported.activeDaysOfWeek);
      }
      setRules(imported as ScheduleRules);
      setJsonError('');
      setShowJsonImport(false);
      setJsonInput('');
      alert('Rules imported successfully!');
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    const newDays = [...rules.activeDaysOfWeek];
    newDays[dayIndex] = !newDays[dayIndex];
    handleChange('activeDaysOfWeek', newDays);
  };

  const handleRegenerate = () => {
    // Force regenerate by clearing history manually
    regenerateSchedule();
    onClose();
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Schedule Rules</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* JSON Import/Export */}
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
                  rules.activeDaysOfWeek[index]
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
              value={rules.targetHoursPerWeek}
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
              value={rules.shiftDurationHours}
              onChange={(e) => handleChange('shiftDurationHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Consecutive Shifts
            </label>
            <input
              type="number"
              value={rules.maxConsecutiveShifts}
              onChange={(e) => handleChange('maxConsecutiveShifts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        {/* Shift Times */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Shift Times Configuration</h3>
            <button
              onClick={handleAddShift}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1 px-3 rounded-md"
            >
              + Add Shift
            </button>
          </div>
          
          <div className="space-y-3">
            {rules.shiftStartTimes.map((shiftTime, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-300 relative">
                {/* Delete button in top right */}
                <button
                  onClick={() => handleDeleteShift(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1 px-2 rounded"
                  title="Delete shift"
                >
                  🗑️ Delete
                </button>

                <div className="flex flex-col gap-3 pr-20">
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Transition Rules */}
        <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Shift Transition Rules</h3>
          <p className="text-xs text-gray-600 mb-3">
            Define which shifts can follow each other. Controls same-day double shifts and consecutive scheduling.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-left">From Shift</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">To Shift</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Same Day?</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Consecutive?</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Min Days Off</th>
                  <th className="border border-gray-300 px-2 py-1 text-center">Max Consecutive</th>
                </tr>
              </thead>
              <tbody>
                {rules.shiftStartTimes.map((_, fromIndex) => (
                  rules.shiftStartTimes.map((__, toIndex) => {
                    const rule = getTransitionRule(fromIndex, toIndex);
                    const isSelfTransition = fromIndex === toIndex;
                    return (
                      <tr key={`${fromIndex}-${toIndex}`} className="hover:bg-purple-100">
                        <td className="border border-gray-300 px-2 py-1 font-medium">
                          {getShiftLabel(fromIndex)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 font-medium">
                          {getShiftLabel(toIndex)}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={rule.sameDay}
                            onChange={(e) => handleUpdateTransitionRule(fromIndex, toIndex, 'sameDay', e.target.checked)}
                            className="h-4 w-4"
                            title="Allow both shifts on the same day"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={rule.consecutive}
                            onChange={(e) => handleUpdateTransitionRule(fromIndex, toIndex, 'consecutive', e.target.checked)}
                            className="h-4 w-4"
                            title="Allow back-to-back shifts (to shift starts immediately after from shift ends)"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="number"
                            value={rule.minDaysOff || 0}
                            onChange={(e) => handleUpdateTransitionRule(fromIndex, toIndex, 'minDaysOff', parseInt(e.target.value))}
                            className="w-16 px-1 py-1 border border-gray-300 rounded text-center"
                            min="0"
                            title="Minimum days off required between these shifts"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {isSelfTransition ? (
                            <input
                              type="number"
                              value={rule.maxConsecutive || ''}
                              onChange={(e) => handleUpdateTransitionRule(fromIndex, toIndex, 'maxConsecutive', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-16 px-1 py-1 border border-gray-300 rounded text-center"
                              min="1"
                              placeholder="Global"
                              title={`Max consecutive ${getShiftLabel(toIndex)} shifts (leave empty to use global max: ${rules.maxConsecutiveShifts})`}
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )).flat()}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <strong>Same Day:</strong> Can work both shifts on the same calendar day<br/>
            <strong>Consecutive:</strong> Can start second shift immediately after first ends<br/>
            <strong>Min Days Off:</strong> Minimum full days off required between shifts (0 = no requirement)
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
        >
          Regenerate Schedule
        </button>
        </div>
      </div>
    </div>
  );
};
