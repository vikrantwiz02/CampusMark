
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  NONE = 'NONE'
}

export interface Semester {
  id: string;
  name: string;
  updatedAt: number;
  isSynced?: boolean;
}

export interface Course {
  id: string;
  name: string;
  color: string;
  semesterId: string;
  code?: string;
  updatedAt: number;
  isSynced?: boolean;
}

export interface AttendanceRecord {
  date: string; // ISO string YYYY-MM-DD
  status: AttendanceStatus;
  courseId: string;
  note?: string;
  updatedAt: number;
  isSynced?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  idToken?: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}
