
import React from 'react';
import { AttendanceStatus, AttendanceRecord } from '../types';
import { STATUS_CONFIG } from '../constants';

interface YearlyAttendanceCalendarProps {
  records: AttendanceRecord[];
  year: number;
  onMonthClick: (month: number) => void;
}

const YearlyAttendanceCalendar: React.FC<YearlyAttendanceCalendarProps> = ({ records, year, onMonthClick }) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (m: number, y: number) => new Date(y, m, 1).getDay();

  const getRecordForDate = (y: number, m: number, d: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return records.find(r => r.date === dateStr);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
      {monthNames.map((monthName, mIdx) => {
        const days = getDaysInMonth(mIdx, year);
        const offset = getStartDay(mIdx, year);

        return (
          <div 
            key={monthName} 
            className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-slate-700 transition-all cursor-pointer group"
            onClick={() => onMonthClick(mIdx)}
          >
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{monthName}</h3>
              <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`off-${i}`} className="aspect-square rounded-sm" />
              ))}
              {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const record = getRecordForDate(year, mIdx, day);
                const status = record?.status || AttendanceStatus.NONE;
                const config = STATUS_CONFIG[status];
                
                return (
                  <div 
                    key={day} 
                    className={`aspect-square rounded-[3px] transition-colors
                      ${status !== AttendanceStatus.NONE ? config.bgColor : 'bg-slate-100/50 dark:bg-slate-800/50'}`}
                    title={`${monthName} ${day}, ${year}: ${status}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YearlyAttendanceCalendar;
