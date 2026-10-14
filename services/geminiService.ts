import { GoogleGenAI } from '@google/genai';
import { GroundingSource, Hospital, SearchResult } from '../types';

const MODEL = 'gemini-2.5-flash';

// Google検索を使う場合は JSON 形式を強制できないため、文章の中の JSON を取り出す
const extractJson = (text: string): { summary?: string; hospitals?: Hospital[] } => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return { summary: text.trim(), hospitals: [] };
  }
};

export const fetchTobanI = async (prefectureName: string): Promise<SearchResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('Gemini APIキーが設定されていません。.env.local の GEMINI_API_KEY を設定してください。');
  }

  const ai = new GoogleGenAI({ apiKey });
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const prompt = `今日は${today}です。${prefectureName}で今日診療している休日当番医・夜間救急診療所をGoogle検索で調べてください。
結果は次の形式の JSON だけを \`\`\`json のコードブロックで返してください。分からない項目は省略してください。
{
  "summary": "調べた結果の短いまとめ（日本語、2〜3文）",
  "hospitals": [
    { "name": "医療機関名", "address": "住所", "phone": "電話番号", "department": "診療科", "hours": "受付時間", "latitude": 緯度(数値), "longitude": 経度(数値) }
  ]
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const parsed = extractJson(response.text ?? '');

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const groundingSources: GroundingSource[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    groundingSources.push({ title: chunk.web?.title ?? uri, uri });
  }

  return {
    summary: parsed.summary ?? '',
    hospitals: Array.isArray(parsed.hospitals) ? parsed.hospitals.filter((h) => h && h.name) : [],
    groundingSources,
  };
};
