
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AttendanceRecord, AttendanceStatus, UserProfile, AttendanceStats as IStats, Course, Semester } from './types';
import AttendanceCalendar from './components/AttendanceCalendar';
import YearlyAttendanceCalendar from './components/YearlyAttendanceCalendar';
import AttendanceStats from './components/AttendanceStats';
import AIInsightsPanel from './components/AIInsightsPanel';
import BottomNav, { TabType } from './components/BottomNav';
import SyncService from './services/syncService';
import { STORAGE_KEYS, COURSE_COLORS, DEMO_USER, PLACEHOLDERS, GOOGLE_CONFIG, APP_CONFIG } from './config';

type ViewMode = 'monthly' | 'yearly';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentYear] = useState(new Date().getFullYear());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const initialData = useMemo(() => SyncService.getLocalData(), []);
  const [semesters, setSemesters] = useState<Semester[]>(initialData.semesters);
  const [courses, setCourses] = useState<Course[]>(initialData.courses);
  const [records, setRecords] = useState<AttendanceRecord[]>(initialData.records);

  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [selectedSemesterIdForCourse, setSelectedSemesterIdForCourse] = useState<string>('');

  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!user && googleButtonRef.current) {
      try {
        // @ts-ignore
        if (typeof google !== 'undefined') {
          // @ts-ignore
          google.accounts.id.initialize({
            client_id: GOOGLE_CONFIG.CLIENT_ID,
            callback: handleGoogleResponse,
          });
          // @ts-ignore
          google.accounts.id.renderButton(googleButtonRef.current, {
            theme: isDarkMode ? "filled_blue" : "outline",
            size: "large",
            width: 280,
          });
        }
      } catch (e) {
        console.warn("Auth initialization error", e);
      }
    }
  }, [user, isDarkMode]);

  const handleGoogleResponse = (response: any) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      const newUser: UserProfile = {
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        idToken: response.credential
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      
      // Fetch and merge data from MongoDB after login
      SyncService.fetchAndMergeFromMongoDB().then(data => {
        setSemesters(data.semesters);
        setCourses(data.courses);
        setRecords(data.records);
      });
    } catch (e) {
      console.error("Auth error", e);
    }
  };

  const simulateLogin = () => {
    const newUser: UserProfile = {
      name: DEMO_USER.NAME,
      email: DEMO_USER.EMAIL,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(DEMO_USER.NAME)}&background=${DEMO_USER.AVATAR_BG}&color=fff`,
      idToken: "simulated_token"
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    
    // Fetch and merge data from MongoDB after login
    SyncService.fetchAndMergeFromMongoDB().then(data => {
      setSemesters(data.semesters);
      setCourses(data.courses);
      setRecords(data.records);
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setIsSyncing(true);
        SyncService.syncWithMongoDB(records, courses, semesters).then(() => setIsSyncing(false));
      }
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    const backupInterval = setInterval(() => SyncService.performHourlyBackup(), 1000 * 60 * 60);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      clearInterval(backupInterval);
    };
  }, [records, courses, semesters]);

  useEffect(() => {
    SyncService.saveLocally(records, courses, semesters);
    if (courses.length > 0 && !activeCourseId) {
      setActiveCourseId(courses[0].id);
    }
  }, [records, courses, semesters, activeCourseId]);

  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId), [courses, activeCourseId]);
  const activeSemester = useMemo(() => semesters.find(s => s.id === activeCourse?.semesterId), [semesters, activeCourse]);
  const filteredRecords = useMemo(() => records.filter(r => r.courseId === activeCourseId), [records, activeCourseId]);

  const handleMarkAttendance = (date: Date, status: AttendanceStatus) => {
    if (!activeCourseId) return;
    const dateStr = date.toISOString().split('T')[0];
    setRecords(prev => {
      const filtered = prev.filter(r => !(r.date === dateStr && r.courseId === activeCourseId));
      if (status === AttendanceStatus.NONE) return filtered;
      return [...filtered, { date: dateStr, status, courseId: activeCourseId, updatedAt: Date.now(), isSynced: false }];
    });
  };

  const handleAddSemester = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newSemesterName.trim()) return;
    const newSem: Semester = { id: Date.now().toString(), name: newSemesterName, updatedAt: Date.now(), isSynced: false };
    setSemesters([...semesters, newSem]);
    setNewSemesterName('');
    if (!selectedSemesterIdForCourse) setSelectedSemesterIdForCourse(newSem.id);
  };

  const handleAddCourse = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newCourseName.trim() || !selectedSemesterIdForCourse) return;
    const newCourse: Course = { id: Date.now().toString(), name: newCourseName, semesterId: selectedSemesterIdForCourse, code: newCourseCode.toUpperCase() || undefined, color: COURSE_COLORS[courses.length % COURSE_COLORS.length], updatedAt: Date.now(), isSynced: false };
    setCourses([...courses, newCourse]);
    setNewCourseName('');
    setNewCourseCode('');
    setActiveCourseId(newCourse.id);
  };

  const handleDeleteCourse = (id: string) => {
    if (confirm('Delete course history permanently?')) {
      setCourses(courses.filter(c => c.id !== id));
      setRecords(records.filter(r => r.courseId !== id));
      if (activeCourseId === id) setActiveCourseId('');
    }
  };

  const handleMasterReset = async () => {
    if (confirm('Permanently wipe all app data?')) {
      await SyncService.clearAllData();
      window.location.reload();
    }
  };

  const stats = useMemo<IStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const statsYear = now.getFullYear();
    const monthlyRecords = filteredRecords.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === statsYear;
    });
    const totalDays = new Date(statsYear, currentMonth + 1, 0).getDate();
    const counts = { [AttendanceStatus.PRESENT]: 0, [AttendanceStatus.ABSENT]: 0, [AttendanceStatus.NONE]: 0 };
    monthlyRecords.forEach(r => { counts[r.status as keyof typeof counts]++; });
    const markedDays = monthlyRecords.length || 0;
    const attendancePercentage = markedDays > 0 ? (counts[AttendanceStatus.PRESENT] / markedDays) * 100 : 0;
    return { totalDays, presentCount: counts[AttendanceStatus.PRESENT], absentCount: counts[AttendanceStatus.ABSENT], attendancePercentage };
  }, [filteredRecords]);

  const ThemeToggleButton = () => (
    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">
      {isDarkMode ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0A9 9 0 115.636 5.636m12.728 12.728A9 9 0 015.636 5.636" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
    </button>
  );

  // Unified Onboarding Top Nav Component
  const OnboardingNav = () => (
    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[100]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{APP_CONFIG.NAME}</span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggleButton />
        <button onClick={handleLogout} className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-100 transition-all">Logout</button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2.25rem] shadow-2xl shadow-indigo-200 dark:shadow-none flex items-center justify-center mx-auto mb-10 text-white animate-bounce-slow">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{APP_CONFIG.NAME}</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-12">{APP_CONFIG.TAGLINE}</p>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[3rem] shadow-sm flex flex-col items-center gap-6">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-2">Authenticated Entry</h2>
            <div ref={googleButtonRef} className="w-full flex justify-center min-h-[56px]" />
            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2" />
            <button onClick={simulateLogin} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95 border-2 border-transparent">Enter as Guest</button>
          </div>
          <div className="mt-12"><ThemeToggleButton /></div>
        </div>
      </div>
    );
  }

  if (semesters.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative transition-colors duration-300">
        <OnboardingNav />
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-10 text-center transition-all mt-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Setup Semester</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-12 font-medium">Hello, {user.name.split(' ')[0]}! Let's get started.</p>
          <form onSubmit={handleAddSemester} className="space-y-6">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">Semester Name</label>
              <input type="text" placeholder={PLACEHOLDERS.SEMESTER} value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-7 py-4.5 text-base font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600" required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95">Continue</button>
          </form>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    // Ensure first semester is selected
    if (semesters.length > 0 && !selectedSemesterIdForCourse) {
      setSelectedSemesterIdForCourse(semesters[0].id);
    }
    
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative transition-colors duration-300">
        <OnboardingNav />
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-10 text-center transition-all mt-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Add Course</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-12 font-medium">Add your first subject</p>
          <form onSubmit={handleAddCourse} className="space-y-6">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">Course Name</label>
              <input type="text" placeholder={PLACEHOLDERS.COURSE_NAME} value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-7 py-4.5 text-base font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all" required />
            </div>
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-3">Course Code (Optional)</label>
              <input type="text" placeholder={PLACEHOLDERS.COURSE_CODE} value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-7 py-4.5 text-base font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all uppercase" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-95">Finish Setup</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 transition-colors duration-300">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[60] px-6 py-4 transition-colors duration-300">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={user.avatar} className="w-10 h-10 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 shadow-sm" alt="Profile" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div className="hidden xs:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{APP_CONFIG.NAME}</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{user.name.split(' ')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <button onClick={() => setShowCourseSelector(true)} className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 uppercase tracking-widest">
              <span>{activeCourse?.name || 'Subject'}</span>
              <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="4" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* REFINED Radio-Style Modal for Course Selection */}
      {showCourseSelector && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowCourseSelector(false)} />
          <div className="relative w-full max-w-md bg-[#1C1717] rounded-t-[3rem] shadow-2xl p-8 pb-14 animate-in slide-in-from-bottom duration-500">
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
            <div className="space-y-10 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
              {semesters.map(sem => (
                <div key={sem.id} className="space-y-5">
                  <h3 className="text-2xl font-black text-white ml-2 tracking-tight">{sem.name}</h3>
                  <div className="space-y-1.5">
                    {courses.filter(c => c.semesterId === sem.id).map(c => (
                      <button key={c.id} onClick={() => { setActiveCourseId(c.id); setShowCourseSelector(false); }}
                        className={`w-full flex items-center justify-between p-7 rounded-[2.5rem] transition-all group ${activeCourseId === c.id ? 'bg-white/10 ring-1 ring-white/20' : 'bg-transparent hover:bg-white/5'}`}>
                        <div className="flex items-center gap-5 text-left">
                          <p className={`text-2xl font-bold tracking-tight transition-colors ${activeCourseId === c.id ? 'text-white' : 'text-slate-500'}`}>{c.name}</p>
                        </div>
                        <div className={`w-9 h-9 rounded-full border-[3px] flex items-center justify-center transition-all ${activeCourseId === c.id ? 'border-[#fca5a5] bg-[#fca5a5]' : 'border-slate-700'}`}>
                          {activeCourseId === c.id && <div className="w-4 h-4 rounded-full bg-[#1C1717]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-5 py-8">
        {activeTab === 'calendar' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-10 flex items-end justify-between">
               <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">{activeCourse?.name}</h1>
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{activeSemester?.name} • {activeCourse?.code || 'ATTENDANCE'}</p>
               </div>
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button onClick={() => setViewMode('monthly')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>Month</button>
                  <button onClick={() => setViewMode('yearly')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'yearly' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>Year</button>
               </div>
            </div>
            {viewMode === 'monthly' ? ( <AttendanceCalendar records={filteredRecords} onMarkAttendance={handleMarkAttendance} /> ) : ( <YearlyAttendanceCalendar records={filteredRecords} year={currentYear} onMonthClick={() => setViewMode('monthly')} /> )}
            <div className="mt-12">
              <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 ml-1">Activity Log</h2>
              <div className="space-y-4">
                {filteredRecords.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5).map((r, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 flex items-center justify-between shadow-sm transition-all hover:translate-x-1">
                    <div className="flex items-center gap-6">
                      <div className={`w-3.5 h-3.5 rounded-full ${r.status === AttendanceStatus.PRESENT ? 'bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-rose-500 shadow-lg shadow-rose-200 dark:shadow-none'}`} />
                      <div>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none mb-2">{new Date(r.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${r.status === AttendanceStatus.PRESENT ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{r.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredRecords.length === 0 && (
                  <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">No data logs</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-3xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Performance</h1>
            <AttendanceStats stats={stats} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className="text-3xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Insights</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">AI Insights Disabled</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">This feature is currently unavailable.</p>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
              <button onClick={handleLogout} className="px-6 py-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 transition-all active:scale-95">Logout</button>
            </div>
            <div className="space-y-10">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-8">New Semester</h2>
                <form onSubmit={handleAddSemester} className="flex gap-4">
                  <input type="text" placeholder="Semester Name" value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500" required />
                  <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
                </form>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-8">New Subject</h2>
                <form onSubmit={handleAddCourse} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                    <select value={selectedSemesterIdForCourse} onChange={(e) => setSelectedSemesterIdForCourse(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none" required>
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                    <input type="text" placeholder="e.g. Physics" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Code</label>
                    <input type="text" placeholder="PHY101" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 uppercase" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all mt-4">Create Course</button>
                </form>
              </div>

              <div className="space-y-12 mt-12">
                {semesters.map(sem => (
                  <div key={sem.id} className="animate-in fade-in duration-500">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-6 ml-1">{sem.name}</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {courses.filter(c => c.semesterId === sem.id).map(c => (
                        <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-7 flex items-center justify-between shadow-sm group">
                          <div className="flex items-center gap-6">
                            <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: c.color }} />
                            <div>
                               <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{c.name}</span>
                               {c.code && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{c.code}</p>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteCourse(c.id)} className="text-slate-200 dark:text-slate-700 hover:text-rose-500 transition-all p-3 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-24">
                <button onClick={handleMasterReset} className="w-full text-[11px] font-black text-rose-500/20 uppercase tracking-[0.6em] hover:text-rose-600 transition-colors py-20 bg-rose-50/5 dark:bg-rose-950/5 rounded-[5rem] border-4 border-dashed border-rose-100/10 active:scale-95">
                  Reset System
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
