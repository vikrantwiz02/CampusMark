
import React from 'react';
import { AttendanceStatus } from './types';

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bgColor: string; textColor: string; icon: React.ReactNode }> = {
  [AttendanceStatus.PRESENT]: {
    label: 'Present',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600',
    textColor: 'text-white',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
  },
  [AttendanceStatus.ABSENT]: {
    label: 'Absent',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500',
    textColor: 'text-white',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
  },
  [AttendanceStatus.NONE]: {
    label: 'Not Marked',
    color: 'text-slate-400',
    bgColor: 'bg-transparent',
    textColor: 'text-slate-600',
    icon: null
  }
};
