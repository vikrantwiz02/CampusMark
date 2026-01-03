export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
};

export const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

export const APP_CONFIG = {
  NAME: 'CampusMark',
  TAGLINE: 'Professional Attendance Intel',
};

export const STORAGE_KEYS = {
  USER: 'campusmark_user',
  THEME: 'campusmark_theme',
  RECORDS: 'campusmark_records_v3',
  COURSES: 'campusmark_courses_v3',
  SEMESTERS: 'campusmark_semesters_v3',
};

export const COURSE_COLORS = [
  '#818cf8',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#22d3ee',
  '#f472b6',
  '#a78bfa',
  '#38bdf8',
  '#fb923c',
  '#4ade80',
];

// Demo User Configuration
export const DEMO_USER = {
  NAME: 'Demo Student',
  EMAIL: 'demo@example.com',
  AVATAR_BG: '6366f1',
};

export const PLACEHOLDERS = {
  SEMESTER: 'e.g. Fall 2024 or Semester 1',
  COURSE_NAME: 'e.g. Computer Science',
  COURSE_CODE: 'e.g. CS101',
};

export const BACKUP_CONFIG = {
  INTERVAL: 60 * 60 * 1000,
};

export const UI_CONFIG = {
  MAX_RECENT_RECORDS: 5,
  ANIMATION_DURATION: 300,
};
