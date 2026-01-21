
import React, { useState, useEffect } from 'react';
import { SchoolPrint, Subject } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import PrintDetail from './components/PrintDetail';

const SAMPLE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'%3E%3Crect width='100%25' height='100%25' fill='%23ffffff'/%3E%3Ctext x='50%25' y='100' font-family='sans-serif' font-size='40' font-weight='bold' text-anchor='middle' fill='%23333333'%3E数学：二次関数の基礎プリント%3C/text%3E%3Ctext x='100' y='250' font-family='sans-serif' font-size='24' fill='%23333333'%3E問題1. 次の関数の頂点の座標を求めよ。%3C/text%3E%3Ctext x='130' y='300' font-family='sans-serif' font-size='30' fill='%23444444'%3Ey = (x - 3)² + 5%3C/text%3E%3Cline x1='80' y1='350' x2='720' y2='350' stroke='%23eeeeee' stroke-width='2'/%3E%3Ctext x='100' y='450' font-family='sans-serif' font-size='24' fill='%23333333'%3E問題2. y = 2x² を右に4, 下に3平行移動した式を書け。%3C/text%3E%3Crect x='100' y='500' width='600' height='100' fill='%23f9fafb' rx='10'/%3E%3Ctext x='50%25' y='900' font-family='sans-serif' font-size='16' text-anchor='middle' fill='%23999999'%3Eスマートプリントマネージャー サンプルデータ%3C/text%3E%3C/svg%3E";

const App: React.FC = () => {
  const [prints, setPrints] = useState<SchoolPrint[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'scanner' | 'detail'>('dashboard');
  const [selectedPrintId, setSelectedPrintId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | 'すべて'>('すべて');

  // Persistence & Initial Data
  useEffect(() => {
    const saved = localStorage.getItem('school_prints');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setPrints(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to load prints", e);
      }
    }
    
    // 最初から模擬プリントを用意
    const sample: SchoolPrint = {
      id: 'sample-math-1',
      title: '二次関数の基礎プリント（サンプル）',
      subject: '数学',
      imageData: SAMPLE_IMAGE,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      isAssignment: true,
      isCompleted: false,
      summary: 'このプリントは二次関数の標準形 y=a(x-p)²+q の読み取りと、グラフの平行移動についての基礎問題です。頂点の座標を正しく把握することがポイントです。',
      createdAt: Date.now()
    };
    setPrints([sample]);
  }, []);

  useEffect(() => {
    if (prints.length > 0) {
      localStorage.setItem('school_prints', JSON.stringify(prints));
    }
  }, [prints]);

  const handleAddPrint = (newPrint: SchoolPrint) => {
    setPrints(prev => [newPrint, ...prev]);
    setCurrentView('dashboard');
  };

  const handleDeletePrint = (id: string) => {
    setPrints(prev => prev.filter(p => p.id !== id));
    setCurrentView('dashboard');
  };

  const handleUpdatePrint = (updated: SchoolPrint) => {
    setPrints(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const selectedPrint = prints.find(p => p.id === selectedPrintId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeSubject={activeSubject} 
        onSubjectSelect={(s) => {
          setActiveSubject(s);
          setCurrentView('dashboard');
        }}
        onAddClick={() => setCurrentView('scanner')}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              prints={prints} 
              activeSubject={activeSubject}
              onPrintSelect={(id) => {
                setSelectedPrintId(id);
                setCurrentView('detail');
              }}
            />
          )}

          {currentView === 'scanner' && (
            <Scanner 
              onScanComplete={handleAddPrint}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'detail' && selectedPrint && (
            <PrintDetail 
              print={selectedPrint}
              onBack={() => setCurrentView('dashboard')}
              onDelete={handleDeletePrint}
              onUpdate={handleUpdatePrint}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
