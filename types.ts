
export type Subject = '国語' | '数学' | '英語' | '理科' | '社会' | 'その他';

export interface SchoolPrint {
  id: string;
  title: string;
  subject: Subject;
  imageData: string; // base64
  deadline?: string; // YYYY-MM-DD
  isAssignment: boolean;
  isCompleted: boolean;
  summary: string;
  createdAt: number;
}

export interface TestQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface PracticeTest {
  id: string;
  printId: string;
  title: string;
  questions: TestQuestion[];
}

export interface AnalysisResult {
  title: string;
  subject: Subject;
  isAssignment: boolean;
  deadline?: string;
  summary: string;
}
