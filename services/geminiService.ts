
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, Subject } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePrint = async (base64Image: string): Promise<AnalysisResult> => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: "この学校のプリント画像を分析してください。タイトル、教科（国語, 数学, 英語, 理科, 社会, その他のいずれか）、これが課題（宿題・提出物）かどうか、もし課題なら提出期限（見つかればYYYY-MM-DD形式、なければnull）、そして内容の要約を3行程度で抽出してください。JSONのみで回答してください。"
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subject: { type: Type.STRING, enum: ['国語', '数学', '英語', '理科', '社会', 'その他'] },
          isAssignment: { type: Type.BOOLEAN },
          deadline: { type: Type.STRING, description: 'YYYY-MM-DD or null' },
          summary: { type: Type.STRING }
        },
        required: ["title", "subject", "isAssignment", "summary"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const askAboutPrint = async (base64Image: string, question: string): Promise<{text: string, sources?: any[]}> => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: `このプリントの内容について質問があります。もしプリントの内容だけでは回答できない場合や、より詳細な解説が必要な場合はGoogle検索を使用して最新かつ正確な情報を教えてください。回答は親しみやすい口調で。質問: ${question}`
        }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    text: response.text || "回答を生成できませんでした。",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const transcribePrint = async (base64Image: string): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: "このプリントに書かれているすべてのテキストを正確に書き起こしてください。読みやすいように適宜改行や箇条書きを使用してください。装飾は不要です。テキストのみを出力してください。"
        }
      ]
    }
  });

  return response.text || "テキストを抽出できませんでした。";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `読み上げてください: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed");
  return base64Audio;
};

export const generateTest = async (base64Image: string, title: string): Promise<any> => {
  const model = 'gemini-3-pro-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image
          }
        },
        {
          text: `このプリント「${title}」の内容に基づいて、理解度を確認するためのテストを5問作成してください。選択肢形式を優先し、難しい場合は記述形式も含めてください。正解と、なぜその答えになるかの詳細な解説も含めてください。`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "記述式の場合は空配列"
                },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "answer", "explanation"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  return JSON.parse(response.text);
};
