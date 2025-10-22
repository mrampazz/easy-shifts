import React from 'react';
import { useSchedule } from '../../hooks/useSchedule';
import { calculateAllNurseStats } from '../../utils/statistics';

export const NurseList: React.FC = () => {
  const { nurses, schedule } = useSchedule();

  if (!schedule) return null;

  const stats = calculateAllNurseStats(nurses, schedule.shifts, schedule.rules, schedule.month);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Nurses ({nurses.length})</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Shifts
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day / Night
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg/Week
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((stat) => (
              <tr key={stat.nurseId} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {stat.nurseName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {stat.totalShifts}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <span className="text-yellow-600">{stat.dayShifts}</span> / 
                  <span className="text-blue-600"> {stat.nightShifts}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {stat.totalHours}h
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={
                    Math.abs(stat.averageHoursPerWeek - schedule.rules.targetHoursPerWeek) < 2
                      ? 'text-green-600 font-semibold'
                      : 'text-red-600'
                  }>
                    {stat.averageHoursPerWeek.toFixed(1)}h
                  </span>
                  <span className="text-gray-400 ml-1">
                    / {schedule.rules.targetHoursPerWeek}h
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
