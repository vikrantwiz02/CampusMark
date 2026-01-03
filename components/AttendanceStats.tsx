
import React from 'react';
import { AttendanceStats as IStats } from '../types';

interface AttendanceStatsProps {
  stats: IStats;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-8 transition-colors">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="42" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="6" fill="none" />
            <circle 
                cx="48" cy="48" r="42" stroke="#4f46e5" strokeWidth="6" fill="none" 
                strokeDasharray={263.8} 
                strokeDashoffset={263.8 - (263.8 * stats.attendancePercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">{Math.round(stats.attendancePercentage)}%</span>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">Total</span>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Present Days</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{stats.presentCount}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Absent Days</span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400">{stats.absentCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Goal Consistency</h3>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${stats.attendancePercentage}%` }} />
        </div>
        <div className="flex justify-between mt-2.5">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Current: {Math.round(stats.attendancePercentage)}%</span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Target: 75%</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;
