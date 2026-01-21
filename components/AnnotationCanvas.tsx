
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface AnnotationCanvasProps {
  backgroundImage: string;
  onSave: (dataUrl: string) => void;
  onDownload: (dataUrl: string) => void;
}

type Tool = 'pen' | 'text' | 'eraser';

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ backgroundImage, onSave, onDownload }) => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState<Tool>('pen');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');

  const getCoords = useCallback((e: React.PointerEvent | PointerEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top)
    };
  }, []);

  const findTextAt = useCallback((x: number, y: number) => {
    return [...textElements].reverse().find(t => {
      const pad = 20; 
      const charWidth = t.fontSize * 0.8;
      const textWidth = t.text.length > 0 ? t.text.length * charWidth : 100;
      const width = Math.max(textWidth, 60);
      const height = t.fontSize;
      
      return (
        x >= t.x - pad &&
        x <= t.x + width + pad &&
        y >= t.y - height - pad &&
        y <= t.y + pad
      );
    });
  }, [textElements]);

  useEffect(() => {
    const initCanvas = () => {
      const bgCanvas = bgCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (!bgCanvas || !drawingCanvas || !scrollRef.current) return;
      const bgCtx = bgCanvas.getContext('2d');
      if (!bgCtx) return;

      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        // コンテナの幅に合わせてリサイズ
        const containerWidth = scrollRef.current!.clientWidth - 48; // パディング分を引く
        const scale = containerWidth / img.width;
        const w = containerWidth;
        const h = img.height * scale;
        
        setCanvasSize({ width: w, height: h });
        bgCanvas.width = w;
        bgCanvas.height = h;
        drawingCanvas.width = w;
        drawingCanvas.height = h;
        bgCtx.drawImage(img, 0, 0, w, h);
      };
    };

    initCanvas();
    const observer = new ResizeObserver(() => initCanvas());
    if (scrollRef.current) observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [backgroundImage]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getCoords(e);
    const canvas = drawingCanvasRef.current;

    if (tool === 'text') {
      const targetText = findTextAt(x, y);
      if (targetText) {
        setActiveTextId(targetText.id);
        setIsDragging(true);
        setDragOffset({ x: x - targetText.x, y: y - targetText.y });
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
      } else if (!isTyping) {
        const id = Math.random().toString(36).substr(2, 9);
        const newText: TextElement = { id, x, y, text: '', color, fontSize: lineWidth * 3 + 16 };
        setTextElements([...textElements, newText]);
        setActiveTextId(id);
        setIsTyping(true);
        setInputText('');
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
    }

    if (tool !== 'text') {
      setActiveTextId(null);
      setIsDrawing(true);
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      }
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getCoords(e);
    
    if (isDragging && activeTextId) {
      setTextElements(prev => prev.map(t => 
        t.id === activeTextId ? { ...t, x: x - dragOffset.x, y: y - dragOffset.y } : t
      ));
    } else if (isDrawing) {
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false);
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const handleExport = (mode: 'save' | 'download') => {
    const bg = bgCanvasRef.current;
    const dr = drawingCanvasRef.current;
    if (!bg || !dr) return;
    const final = document.createElement('canvas');
    final.width = bg.width; final.height = bg.height;
    const fCtx = final.getContext('2d');
    if (!fCtx) return;
    fCtx.drawImage(bg, 0, 0);
    fCtx.drawImage(dr, 0, 0);
    textElements.forEach(t => {
      if (!t.text.trim()) return;
      fCtx.font = `bold ${t.fontSize}px sans-serif`;
      fCtx.fillStyle = t.color;
      fCtx.textBaseline = 'bottom';
      fCtx.fillText(t.text, t.x, t.y);
    });
    const dataUrl = final.toDataURL('image/jpeg', 0.9);
    if (mode === 'save') onSave(dataUrl); else onDownload(dataUrl);
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full max-h-[80vh] animate-fade-in">
      {/* 操作パネル（スリム化） */}
      <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
          {[
            { id: 'pen' as Tool, icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', label: 'ペン' },
            { id: 'text' as Tool, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: '文字' },
            { id: 'eraser' as Tool, icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', label: '消し' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => { setTool(item.id); if(item.id !== 'text') setActiveTextId(null); }} 
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all border ${tool === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-white hover:text-slate-800'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={item.icon}/></svg>
              <span className="text-[10px] font-bold hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {['#ef4444', '#3b82f6', '#10b981', '#1e293b'].map(c => (
              <button 
                key={c} 
                onClick={() => { setColor(c); if(activeTextId) setTextElements(prev => prev.map(t => t.id === activeTextId ? {...t, color: c} : t)); }} 
                className={`w-5 h-5 rounded-full border transition-all ${color === c ? 'ring-2 ring-indigo-500 scale-110 shadow-sm' : 'border-slate-200 opacity-60'}`} 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <input 
              type="range" min="2" max="25" step="1" value={lineWidth} 
              onChange={(e) => { 
                const v = Number(e.target.value); 
                setLineWidth(v); 
                if(activeTextId) setTextElements(prev => prev.map(t => t.id === activeTextId ? {...t, fontSize: v * 3 + 16} : t));
              }} 
              className="w-16 h-1 accent-indigo-600" 
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeTextId && tool === 'text' && (
            <button 
              onClick={() => { setTextElements(textElements.filter(t => t.id !== activeTextId)); setActiveTextId(null); }} 
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          )}
          <button onClick={() => { if(confirm('リセットしますか？')){ setTextElements([]); const ctx = drawingCanvasRef.current?.getContext('2d'); ctx?.clearRect(0,0,drawingCanvasRef.current!.width, drawingCanvasRef.current!.height); } }} className="text-[9px] font-bold text-slate-400 px-2 hover:text-rose-500 uppercase tracking-tight transition-colors">リセット</button>
        </div>
      </div>

      {/* キャンバス表示領域（スクロール最適化） */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-200/50 rounded-lg overflow-auto p-4 md:p-6 custom-scrollbar flex justify-center border border-slate-200"
      >
        <div 
          className="relative bg-white shadow-xl rounded-sm shrink-0"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          <canvas ref={bgCanvasRef} className="absolute inset-0 z-0 pointer-events-none" />
          <canvas 
            ref={drawingCanvasRef} 
            className={`absolute inset-0 z-10 block touch-none ${tool === 'text' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          
          <div className="absolute inset-0 z-20 pointer-events-none">
            {textElements.map(t => (
              <div 
                key={t.id}
                className={`absolute whitespace-nowrap px-1 py-0.5 rounded transition-all flex items-center ${activeTextId === t.id && tool === 'text' ? 'ring-2 ring-indigo-500 bg-white/70 shadow-sm z-30' : 'z-20'}`}
                style={{ left: t.x, top: t.y - t.fontSize, color: t.color, fontSize: `${t.fontSize}px`, fontWeight: 'bold', lineHeight: 1 }}
              >
                {t.text || (activeTextId === t.id && !isTyping ? '...' : '')}
              </div>
            ))}
          </div>

          {isTyping && activeTextId && tool === 'text' && (
            <div className="absolute z-40 pointer-events-auto" style={{ left: textElements.find(t => t.id === activeTextId)?.x, top: (textElements.find(t => t.id === activeTextId)?.y || 0) - (textElements.find(t => t.id === activeTextId)?.fontSize || 0) }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onBlur={() => {
                  if (activeTextId) {
                    if (!inputText.trim()) setTextElements(prev => prev.filter(t => t.id !== activeTextId));
                    else setTextElements(prev => prev.map(t => t.id === activeTextId ? { ...t, text: inputText } : t));
                  }
                  setIsTyping(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.blur()}
                className="bg-white border-2 border-indigo-500 p-1.5 rounded shadow-xl outline-none font-bold"
                style={{ fontSize: `${textElements.find(t => t.id === activeTextId)?.fontSize}px`, color }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 shrink-0">
        <button onClick={() => handleExport('save')} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-all text-[11px] shadow-sm">保存</button>
        <button onClick={() => handleExport('download')} className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md text-[11px] border border-indigo-600">出力</button>
      </div>
    </div>
  );
};

export default AnnotationCanvas;
