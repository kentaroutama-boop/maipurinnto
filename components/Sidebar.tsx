
import React from 'react';
import { Subject } from '../types';

interface SidebarProps {
  activeSubject: Subject | 'すべて';
  onSubjectSelect: (s: Subject | 'すべて') => void;
  onAddClick: () => void;
}

const subjects: {id: Subject | 'すべて', icon: string}[] = [
  {id: 'すべて', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'},
  {id: '国語', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'},
  {id: '数学', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'},
  {id: '英語', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129'},
  {id: '理科', icon: 'M19.423 15.621a2 2 0 000-3.242l-2.056-1.468a2 2 0 00-2.367.001l-2.057 1.469a2 2 0 000 3.242l2.057 1.469a2 2 0 002.367 0l2.056-1.469z M8 13.166V15a2 2 0 002 2h2m4-10a2 2 0 012 2v1h1a1 1 0 110 2h-1v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V9a2 2 0 012-2h3z'},
  {id: '社会', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
  {id: 'その他', icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z'},
];

const Sidebar: React.FC<SidebarProps> = ({ activeSubject, onSubjectSelect, onAddClick }) => {
  return (
    <div className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-[100] relative">
      <div className="p-4 md:p-5 flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100 ring-2 ring-indigo-50">
            学
          </div>
          <div className="hidden md:block">
            <span className="font-black text-lg tracking-tight text-slate-900 block leading-none">プリント管理</span>
            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 block">Smart Manager</span>
          </div>
        </div>

        {/* Add Button */}
        <button 
          onClick={onAddClick}
          className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 mb-8 border-2 border-slate-900 shadow-sm text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
          <span className="hidden md:inline">新規追加</span>
        </button>

        {/* Navigation */}
        <nav className="space-y-1.5 flex-1">
          <p className="hidden md:block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 px-2">教科一覧</p>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => onSubjectSelect(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all border-2 ${
                activeSubject === s.id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold' 
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`w-4 h-4 shrink-0 ${activeSubject === s.id ? 'text-white' : 'text-slate-400'}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={s.icon}/></svg>
              </div>
              <span className="hidden md:inline text-[13px] font-bold">{s.id}</span>
            </button>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="hidden md:block mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-200 text-base">
              📅
            </div>
            <div className="overflow-hidden">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">年度</p>
              <p className="text-[10px] font-bold text-slate-800 truncate">2024 年度</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
