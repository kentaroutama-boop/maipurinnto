
import React, { useState, useRef } from 'react';
import { analyzePrint } from '../services/geminiService';
import { SchoolPrint, AnalysisResult, Subject } from '../types';

interface ScannerProps {
  onScanComplete: (print: SchoolPrint) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onCancel }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewedData, setReviewedData] = useState<AnalysisResult | null>(null);
  const [hasDeadline, setHasDeadline] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError("画像ファイルを選択してください。");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzePrint(selectedImage);
      setReviewedData(result);
      setHasDeadline(!!result.deadline);
      setIsReviewing(true);
    } catch (e) {
      setError("AIによる分析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalRegister = () => {
    if (!selectedImage || !reviewedData) return;
    onScanComplete({
      id: Math.random().toString(36).substring(7),
      title: reviewedData.title || "無題のプリント",
      subject: reviewedData.subject || 'その他',
      imageData: selectedImage,
      isAssignment: reviewedData.isAssignment,
      isCompleted: false,
      deadline: hasDeadline ? reviewedData.deadline : undefined,
      summary: reviewedData.summary || "",
      createdAt: Date.now()
    });
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-10 relative overflow-hidden">
        <header className="text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-indigo-700 rounded-xl flex items-center justify-center text-white mx-auto mb-5 shadow-lg rotate-2 ring-1 ring-indigo-50">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
            {isReviewing ? "読み取り情報の確認" : "プリントを登録"}
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            {isReviewing ? "自動抽出された情報を修正できます。" : "AIが教科や課題の有無を自動判別します。"}
          </p>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg text-center animate-shake">
            {error}
          </div>
        )}

        {!selectedImage ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all text-center ${
              isDragging 
                ? 'bg-indigo-50 border-indigo-500 scale-[1.02]' 
                : 'border-slate-200 bg-slate-50/20 hover:bg-slate-50 hover:border-indigo-400'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 shadow-sm border transition-all ${
              isDragging ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-700 border-slate-100 group-hover:scale-105'
            }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4"/></svg>
            </div>
            <p className="font-bold text-lg text-slate-800 mb-1">写真を選択</p>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">またはファイルをここにドロップ</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          </div>
        ) : isReviewing && reviewedData ? (
          <div className="space-y-6 animate-fade-in relative z-10">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 mb-1.5 px-1 uppercase tracking-wider">プリントのタイトル</label>
                  <input 
                    type="text"
                    value={reviewedData.title}
                    onChange={(e) => setReviewedData({...reviewedData, title: e.target.value})}
                    className="w-full p-3 rounded-lg bg-white shadow-sm border border-slate-200 focus:border-indigo-600 outline-none font-bold text-slate-900 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 mb-1.5 px-1 uppercase tracking-wider">教科</label>
                    <select 
                      value={reviewedData.subject}
                      onChange={(e) => setReviewedData({...reviewedData, subject: e.target.value as Subject})}
                      className="w-full p-3 rounded-lg bg-white shadow-sm border border-slate-200 outline-none font-bold text-slate-900 text-[13px]"
                    >
                      {['国語', '数学', '英語', '理科', '社会', 'その他'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2.5 cursor-pointer group w-full p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${reviewedData.isAssignment ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-300 shadow-inner'}`}>
                        {reviewedData.isAssignment && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <input type="checkbox" className="hidden" checked={reviewedData.isAssignment} onChange={(e) => setReviewedData({...reviewedData, isAssignment: e.target.checked})} />
                      <span className="font-bold text-slate-700 text-[11px]">これは課題</span>
                    </label>
                  </div>
                </div>
                {reviewedData.isAssignment && (
                  <div className="p-4 bg-white rounded-lg border border-indigo-50 shadow-sm animate-slide-up">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-indigo-700 px-1">提出期限</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    {hasDeadline && <input type="date" value={reviewedData.deadline || ''} onChange={(e) => setReviewedData({...reviewedData, deadline: e.target.value})} className="w-full p-2.5 rounded-md bg-slate-50 border border-slate-100 font-bold outline-none text-slate-900 text-[13px]" />}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsReviewing(false)} className="flex-1 py-3 px-3 rounded-xl font-bold text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all text-[11px] uppercase tracking-widest">修正</button>
              <button onClick={handleFinalRegister} className="flex-[2] py-3 px-3 rounded-xl font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-lg transition-all active:scale-95 text-sm">保存する</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in relative z-10">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-[4/5] bg-slate-50 group">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[2px] flex flex-col items-center justify-center">
                  <div className="bg-white/95 backdrop-blur px-6 py-4 rounded-xl shadow-xl flex flex-col items-center gap-3 border border-indigo-50">
                    <svg className="animate-spin h-6 w-6 text-indigo-700" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="font-bold text-indigo-800 text-[10px] tracking-widest">分析中...</span>
                  </div>
                </div>
              )}
              <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg p-2 text-slate-900 hover:text-rose-600 shadow-md border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} disabled={isAnalyzing} className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all text-xs">やめる</button>
              <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                内容を解析
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
