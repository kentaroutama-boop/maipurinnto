
import React, { useState, useRef } from 'react';
import { SchoolPrint, Subject, PracticeTest } from '../types';
import { askAboutPrint, generateTest, generateSpeech, transcribePrint } from '../services/geminiService';
import TestInterface from './TestInterface';
import AnnotationCanvas from './AnnotationCanvas';

interface PrintDetailProps {
  print: SchoolPrint;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: SchoolPrint) => void;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const PrintDetail: React.FC<PrintDetailProps> = ({ print, onBack, onDelete, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'transcription' | 'draw' | 'qa' | 'test'>('hub');
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<{q: string, a: string, audio?: string, sources?: any[]}[]>([]);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [currentTest, setCurrentTest] = useState<PracticeTest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | 'summary' | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleTranscribe = async () => {
    if (transcription) { setActiveTab('transcription'); return; }
    setIsTranscribing(true);
    try {
      const text = await transcribePrint(print.imageData);
      setTranscription(text);
      setActiveTab('transcription');
    } catch (e) { alert("テキストの書き起こしに失敗しました。"); } finally { setIsTranscribing(false); }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!SpeechRecognition) { alert("音声入力をサポートしていません。"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => { setQuestion(event.results[0][0].transcript); };
    recognition.start();
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    try {
      const response = await askAboutPrint(print.imageData, question);
      setQaHistory(prev => [{ q: question, a: response.text, sources: response.sources }, ...prev]);
      setQuestion('');
    } catch (e) { alert("回答に失敗しました。"); } finally { setIsAsking(false); }
  };

  const playAudio = async (text: string, identifier: number | 'summary') => {
    if (isSpeaking === identifier) { currentSourceRef.current?.stop(); setIsSpeaking(null); return; }
    currentSourceRef.current?.stop();
    setIsSpeaking(identifier);
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const audioBase64 = await generateSpeech(text);
      const audioData = decodeBase64(audioBase64);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => { if (isSpeaking === identifier) setIsSpeaking(null); };
      currentSourceRef.current = source;
      source.start();
    } catch (e) {
      setIsSpeaking(null);
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'ja-JP';
      msg.onend = () => setIsSpeaking(null);
      window.speechSynthesis.speak(msg);
    }
  };

  const handleGenerateTest = async () => {
    setIsGeneratingTest(true);
    try {
      const testData = await generateTest(print.imageData, print.title);
      setCurrentTest({ id: Math.random().toString(36).substring(7), printId: print.id, title: testData.title, questions: testData.questions });
      setActiveTab('test');
    } catch (e) { alert("テスト生成に失敗しました。"); } finally { setIsGeneratingTest(false); }
  };

  const getSubjectColor = (s: Subject) => {
    switch(s) {
      case '国語': return 'text-rose-700 bg-rose-50 border-rose-100';
      case '数学': return 'text-blue-700 bg-blue-50 border-blue-100';
      case '英語': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case '理科': return 'text-purple-700 bg-purple-50 border-purple-100';
      case '社会': return 'text-amber-700 bg-amber-50 border-amber-100';
      default: return 'text-slate-700 bg-slate-50 border-slate-100';
    }
  };

  const isDrawingView = activeTab === 'draw';

  return (
    <div className="animate-fade-in pb-20 max-w-5xl mx-auto px-4">
      {/* Detail Header Sticky Area */}
      <div className="sticky top-0 z-[60] bg-slate-50/90 backdrop-blur-sm pt-4 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
              <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black py-0.5 px-2.5 rounded-md border ${getSubjectColor(print.subject)}`}>{print.subject}</span>
                <h1 className="text-lg md:text-xl font-black text-slate-900 line-clamp-1 tracking-tight">{print.title}</h1>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onUpdate({...print, isCompleted: !print.isCompleted})} className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-sm border ${print.isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}>
              <div className={`w-2 h-2 rounded-full ${print.isCompleted ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              {print.isCompleted ? '完了' : '未完了'}
            </button>
            <button onClick={() => setIsEditing(!isEditing)} className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all border ${isEditing ? 'bg-indigo-700 border-indigo-700 text-white' : 'bg-white text-slate-800 border-slate-200 shadow-sm'}`}>{isEditing ? '保存' : '修正'}</button>
          </div>
        </div>

        {/* Improved Balanced Tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'hub', label: '要約・解説', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'draw', label: '書き込み', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
            { id: 'qa', label: 'AI先生', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
            { id: 'test', label: 'ミニテスト', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all border ${activeTab === item.id ? 'bg-indigo-700 border-indigo-700 text-white shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}/></svg>
              <span className="text-[11px] font-black">{item.label}</span>
            </button>
          ))}
          <div className="w-[1px] bg-slate-100 my-1 mx-1" />
          <button onClick={handleTranscribe} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all border ${activeTab === 'transcription' ? 'bg-indigo-700 border-indigo-700 text-white shadow-sm' : 'text-slate-400 border-transparent hover:text-indigo-700 hover:bg-indigo-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span className="text-[11px] font-black">文字抽出</span>
          </button>
        </div>
      </div>

      {/* Grid Ratio adjusted to make print smaller on desktop */}
      <div className={`mt-6 grid grid-cols-1 ${isDrawingView ? '' : 'lg:grid-cols-[360px_1fr]'} gap-8 items-start`}>
        {!isDrawingView && (
          <div className="lg:sticky lg:top-[160px]">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group ring-2 ring-white max-w-[360px] mx-auto lg:mx-0">
              {/* Reduced max-h to decrease print dominance */}
              <img src={print.imageData} alt={print.title} className="w-full h-auto object-contain bg-slate-50 max-h-[42vh]" />
              <button onClick={() => setActiveTab('draw')} className="absolute bottom-4 right-4 bg-indigo-700 text-white p-3 rounded-lg shadow-lg scale-100 hover:scale-105 active:scale-95 transition-all border border-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
            </div>
            
            {isEditing && (
              <div className="mt-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4 animate-slide-up max-w-[360px] mx-auto lg:mx-0">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">タイトル</label>
                  <input type="text" value={print.title} onChange={(e) => onUpdate({...print, title: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:border-indigo-600 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 mb-1.5 block px-1">教科</label>
                    <select value={print.subject} onChange={(e) => onUpdate({...print, subject: e.target.value as Subject})} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold">
                      {['国語', '数学', '英語', '理科', '社会', 'その他'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 mb-1.5 block px-1">期限</label>
                    <input type="date" value={print.deadline || ''} onChange={(e) => onUpdate({...print, deadline: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold" />
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => { if(confirm('このプリントを削除しますか？')) onDelete(print.id); }} className="mt-6 w-full text-slate-300 hover:text-rose-400 text-[9px] font-black uppercase tracking-[0.2em] text-center py-2 transition-colors max-w-[360px] mx-auto lg:mx-0">プリントを削除</button>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-100 shadow-sm min-h-[45vh]">
            {activeTab === 'hub' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">AIの要約・ポイント</h3>
                  <button onClick={() => playAudio(print.summary, 'summary')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border ${isSpeaking === 'summary' ? 'bg-indigo-700 border-indigo-700 text-white shadow-md' : 'bg-slate-50 text-indigo-700 hover:bg-indigo-50 border-indigo-100'}`}>
                    {isSpeaking === 'summary' ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : '🔊'} 
                    音読
                  </button>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-800 text-[14px] leading-relaxed font-bold">
                  {print.summary}
                </div>
              </div>
            )}

            {activeTab === 'draw' && (
              <div className="h-full min-h-[60vh]">
                <AnnotationCanvas 
                  backgroundImage={print.imageData}
                  onSave={(url) => { onUpdate({...print, imageData: url}); alert('保存しました'); setActiveTab('hub'); }}
                  onDownload={(url) => { const link = document.createElement('a'); link.href = url; link.download = `${print.title}_書込.jpg`; link.click(); }}
                />
              </div>
            )}

            {activeTab === 'transcription' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">読み取り内容</h3>
                  <button onClick={() => { navigator.clipboard.writeText(transcription || ''); alert('コピーしました'); }} className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">コピー</button>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl text-slate-100 text-xs font-medium leading-loose whitespace-pre-wrap max-h-[55vh] overflow-y-auto border border-slate-800 shadow-inner">
                  {transcription || '読み取り中...'}
                </div>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="space-y-5 animate-fade-in">
                <div className="relative">
                  <textarea 
                    value={question} 
                    onChange={(e) => setQuestion(e.target.value)} 
                    placeholder="わからないところを質問してみよう..." 
                    className="w-full rounded-xl border border-slate-200 p-6 min-h-[160px] bg-slate-50 outline-none text-base font-bold focus:bg-white focus:border-indigo-600 transition-all placeholder:text-slate-300" 
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={handleVoiceInput} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${isListening ? 'bg-rose-600 border-rose-600 text-white animate-pulse shadow-md' : 'bg-white text-slate-400 border-slate-200 shadow-sm'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-3 3 3 3 0 01-3-3V5a3 3 0 013-3z"/></svg>
                    </button>
                    <button onClick={handleAsk} disabled={isAsking || !question.trim()} className="bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-[12px] shadow-md disabled:opacity-50 active:scale-95 transition-all border border-indigo-700">
                      {isAsking ? '考え中' : 'AIに質問'}
                    </button>
                  </div>
                </div>
                <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-2 no-scrollbar">
                  {qaHistory.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-end"><div className="bg-indigo-700 text-white rounded-xl rounded-tr-none px-4 py-3 text-xs font-bold shadow-sm">{item.q}</div></div>
                      <div className="bg-slate-50 text-slate-900 rounded-xl rounded-tl-none px-5 py-6 text-[13px] border border-slate-100 leading-relaxed relative font-bold shadow-sm">
                        <button onClick={() => playAudio(item.a, i)} className="absolute top-3 right-3 p-1.5 text-indigo-700 hover:text-indigo-900 bg-white rounded-md shadow-sm border border-slate-100 text-[10px]">🔊 音声</button>
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'test' && (
              <div className="animate-fade-in h-full flex flex-col justify-center">
                {currentTest ? <TestInterface test={currentTest} onReset={() => setActiveTab('hub')} /> : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">AIテスト生成</h3>
                    <p className="text-slate-500 text-[12px] mb-8 max-w-[280px] mx-auto font-bold leading-relaxed">このプリントの内容から、あなたの理解度を確認するミニテストを作成します。</p>
                    <button onClick={handleGenerateTest} disabled={isGeneratingTest} className="w-full max-w-xs py-4 bg-indigo-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 text-sm active:scale-95 transition-all border border-indigo-700">
                      {isGeneratingTest ? '作成中...' : 'テストを開始'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDetail;
