
import React, { useState } from 'react';
import { PracticeTest } from '../types';

interface TestInterfaceProps {
  test: PracticeTest;
  onReset: () => void;
}

const TestInterface: React.FC<TestInterfaceProps> = ({ test, onReset }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (ans: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentStep]: ans }));
  };

  const next = () => {
    if (currentStep < test.questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (showResults) {
    return (
      <div className="animate-fade-in">
        <header className="mb-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800">テスト結果</h3>
          <p className="text-slate-500">回答を確認して理解を深めましょう</p>
        </header>

        <div className="space-y-6">
          {test.questions.map((q, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex gap-4 items-start">
                <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800">{q.question}</h4>
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    正解: {q.answer}
                  </div>
                  {selectedAnswers[i] && selectedAnswers[i] !== q.answer && (
                    <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold">
                      あなたの回答: {selectedAnswers[i]}
                    </div>
                  )}
                  <p className="text-slate-600 text-sm leading-relaxed">
                    <span className="font-bold block mb-1">【解説】</span>
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onReset}
          className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          テストを終了
        </button>
      </div>
    );
  }

  const q = test.questions[currentStep];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-slate-800">問題 {currentStep + 1} / {test.questions.length}</h3>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / test.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
          {q.question}
        </h4>

        <div className="space-y-3">
          {q.options && q.options.length > 0 ? (
            q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedAnswers[currentStep] === opt 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {opt}
              </button>
            ))
          ) : (
            <textarea
              value={selectedAnswers[currentStep] || ''}
              onChange={(e) => handleSelect(e.target.value)}
              placeholder="あなたの回答を入力..."
              className="w-full rounded-xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 p-4 bg-slate-50 min-h-[100px]"
            />
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={prev}
          disabled={currentStep === 0}
          className="flex-1 py-3 font-bold text-slate-500 disabled:opacity-30"
        >
          戻る
        </button>
        <button 
          onClick={next}
          className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100"
        >
          {currentStep === test.questions.length - 1 ? "採点する" : "次へ"}
        </button>
      </div>
    </div>
  );
};

export default TestInterface;
