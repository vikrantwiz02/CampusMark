
import React, { useState } from 'react';
import { AttendanceRecord, AttendanceStats } from '../types';
import { getAttendanceInsights } from '../services/geminiService';

interface AIInsightsPanelProps {
  records: AttendanceRecord[];
  courseName: string;
  stats: AttendanceStats;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ records, courseName, stats }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    trends: string[];
    productivityScore: number;
    tips: string[];
  } | null>(null);

  const generateInsights = async () => {
    if (records.length < 1) return;
    setLoading(true);
    const data = await getAttendanceInsights(records, courseName, stats);
    setInsights(data);
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 overflow-hidden mb-8 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">AI Analysis</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Context: {courseName}</p>
          </div>
        </div>
        <button 
          onClick={generateInsights}
          disabled={loading || records.length === 0}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {loading ? 'Analyzing...' : 'Refresh AI'}
        </button>
      </div>

      {insights ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Coach's Evaluation</span>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mt-2 font-medium italic">"{insights.summary}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Consistency Score</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{insights.productivityScore}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Patterns Identified</span>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {insights.trends.map((t, i) => (
                      <div key={i} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-indigo-400" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Action Plan</span>
                <ul className="mt-3 space-y-3">
                  {insights.tips.map((tip, i) => (
                    <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex gap-2 leading-snug">
                      <span className="text-indigo-600 dark:text-indigo-400 font-black shrink-0">0{i+1}.</span> {tip}
                    </li>
                  ))}
                </ul>
             </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {records.length === 0 ? 'Mark data to unlock AI' : 'Generate high-accuracy report'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
