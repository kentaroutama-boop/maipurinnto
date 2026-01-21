
import React, { useState, useMemo } from 'react';
import { SchoolPrint, Subject } from '../types';

interface DashboardProps {
  prints: SchoolPrint[];
  activeSubject: Subject | 'すべて';
  onPrintSelect: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ prints, activeSubject, onPrintSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const urgentTasks = useMemo(() => {
    return prints
      .filter(p => p.isAssignment && !p.isCompleted && p.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 3);
  }, [prints]);

  const subjectStats = useMemo(() => {
    const subs: Subject[] = ['国語', '数学', '英語', '理科', '社会', 'その他'];
    return subs.map(sub => {
      const subPrints = prints.filter(p => p.subject === sub);
      const assignments = subPrints.filter(p => p.isAssignment);
      const completed = assignments.filter(p => p.isCompleted).length;
      return {
        name: sub,
        count: subPrints.length,
        percent: assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : 100
      };
    });
  }, [prints]);

  const filteredPrints = useMemo(() => {
    return prints
      .filter(p => activeSubject === 'すべて' || p.subject === activeSubject)
      .filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [prints, activeSubject, searchQuery]);

  const getSubjectColor = (s: string) => {
    switch(s) {
      case '国語': return 'bg-rose-600';
      case '数学': return 'bg-blue-600';
      case '英語': return 'bg-emerald-600';
      case '理科': return 'bg-purple-600';
      case '社会': return 'bg-amber-600';
      default: return 'bg-slate-500';
    }
  };

  const getSubjectBadge = (s: Subject) => {
    const base = "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight border ";
    switch(s) {
      case '国語': return base + 'bg-rose-50 text-rose-700 border-rose-100';
      case '数学': return base + 'bg-blue-50 text-blue-700 border-blue-100';
      case '英語': return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case '理科': return base + 'bg-purple-50 text-purple-700 border-purple-100';
      case '社会': return base + 'bg-amber-50 text-amber-700 border-amber-100';
      default: return base + 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-20 px-1">
      {/* Header & Search */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-1">
            {activeSubject === 'すべて' ? 'マイプリント' : activeSubject}
          </h1>
          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.15em]">
            {filteredPrints.length} 枚を管理中
          </p>
        </div>
        <div className="relative w-full sm:w-64 group">
          <input 
            type="text" 
            placeholder="内容で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 transition-all shadow-sm outline-none font-bold text-slate-900 text-[13px]"
          />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </header>

      {/* Progress Stats Summary (Center Optimized) */}
      {activeSubject === 'すべて' && (
        <section className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex justify-between gap-2 overflow-x-auto pb-2 no-scrollbar">
            {subjectStats.map(sub => (
              <div key={sub.name} className="flex flex-col items-center gap-2 min-w-[56px] flex-1">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                    <circle 
                      cx="20" cy="20" r="17" 
                      stroke="currentColor" strokeWidth="4" 
                      fill="transparent" className="text-slate-100" 
                    />
                    <circle 
                      cx="20" cy="20" r="17" 
                      stroke="currentColor" strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray={106.8} 
                      strokeDashoffset={106.8 * (1 - sub.percent / 100)} 
                      className={`${getSubjectColor(sub.name).replace('bg-', 'text-')} transition-all duration-1000 ease-out`} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-[8px] font-black text-slate-900">{sub.percent}%</span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{sub.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Urgent Section */}
      {activeSubject === 'すべて' && urgentTasks.length > 0 && (
        <section className="animate-slide-up">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            🚨 期限が近い課題
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onPrintSelect(task.id)}
                className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-sm cursor-pointer hover:bg-rose-50/20 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={getSubjectBadge(task.subject)}>{task.subject}</span>
                  <span className="text-rose-600 font-black text-[8px] uppercase tracking-tighter">Deadline</span>
                </div>
                <h3 className="font-bold text-slate-900 text-[12px] line-clamp-1 mb-1.5">{task.title}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full w-2/3" />
                  </div>
                  <span className="text-[8px] font-black text-rose-500">{task.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredPrints.map((print) => (
          <div 
            key={print.id}
            onClick={() => onPrintSelect(print.id)}
            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-slate-200"
          >
            {print.isCompleted && (
              <div className="absolute top-2 left-2 z-20 bg-emerald-600 text-white p-1 rounded-full shadow-lg ring-1 ring-white">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
              </div>
            )}
            
            <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
              <img 
                src={print.imageData} 
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${print.isCompleted ? 'opacity-40 grayscale' : ''}`}
                alt={print.title}
              />
              {print.deadline && !print.isCompleted && (
                <div className="absolute top-2 right-2 bg-rose-600 text-white px-1.5 py-0.5 rounded text-[7px] font-black shadow-lg">
                  {print.deadline}
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="flex gap-1 mb-1.5">
                <span className={getSubjectBadge(print.subject)}>{print.subject}</span>
              </div>
              <h3 className="text-[12px] font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{print.title}</h3>
              <p className="text-slate-500 text-[10px] font-bold leading-tight line-clamp-2 h-6">{print.summary}</p>
              
              <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[8px] font-bold text-slate-400">
                <span>{new Date(print.createdAt).toLocaleDateString()}</span>
                <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
