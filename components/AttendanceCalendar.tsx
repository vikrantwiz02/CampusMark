
import React, { useState } from 'react';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { STATUS_CONFIG } from '../constants';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  onMarkAttendance: (dateStr: string, status: AttendanceStatus) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ records, onMarkAttendance }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDay = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const offset = startDay(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getRecordForDate = (date: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return records.find(r => r.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 transition-colors">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{monthNames[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all text-slate-500 dark:text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800/50">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`off-${i}`} className="aspect-square border-b border-r border-slate-50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/50" />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const record = getRecordForDate(day);
          const status = record?.status || AttendanceStatus.NONE;
          const config = STATUS_CONFIG[status];
          const today = isToday(day);
          const isSelected = selectedDay === day;

          return (
            <div 
              key={day} 
              className={`relative aspect-square border-b border-r border-slate-50 dark:border-slate-800/50 transition-all cursor-pointer 
                ${status !== AttendanceStatus.NONE ? config.bgColor : (isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800')}`}
              onClick={() => setSelectedDay(isSelected ? null : day)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-semibold transition-colors
                  ${status !== AttendanceStatus.NONE ? 'text-white' : (today ? 'text-indigo-600 dark:text-indigo-400 font-bold underline underline-offset-4' : 'text-slate-700 dark:text-slate-300')}`}>
                  {day}
                </span>
              </div>

              {isSelected && (
                <div className="absolute bottom-[115%] left-1/2 -translate-x-1/2 mb-2 z-[70] bg-white dark:bg-slate-800 shadow-xl dark:shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 p-1 flex gap-1 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      onMarkAttendance(dateStr, AttendanceStatus.PRESENT);
                      setSelectedDay(null);
                    }}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${status === AttendanceStatus.PRESENT ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}
                  >
                    Present
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      onMarkAttendance(dateStr, AttendanceStatus.ABSENT);
                      setSelectedDay(null);
                    }}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white' : 'hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400'}`}
                  >
                    Absent
                  </button>
                  <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                       onMarkAttendance(dateStr, AttendanceStatus.NONE);
                       setSelectedDay(null);
                    }}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {Array.from({ length: (7 - ((offset + totalDays) % 7)) % 7 }).map((_, i) => (
          <div key={`off-e-${i}`} className="aspect-square border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/50" />
        ))}
      </div>
      
      <div className="px-5 py-3 bg-white dark:bg-slate-900 flex justify-center gap-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Absent</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
