import { GoogleGenAI } from '@google/genai';
import { GroundingSource, Hospital, SearchResult } from '../types';

const MODEL = 'gemini-2.5-flash';

const buildPrompt = (prefectureName: string): string => {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return `今日は${today}です。${prefectureName}で本日診療している休日当番医・夜間当番医（救急当番医）をGoogle検索で調べてください。
自治体や医師会の公式情報を優先し、見つかった医療機関を最大10件まで挙げてください。

回答は次のJSONだけを \`\`\`json コードブロックで返してください。わからない項目は省略してください。
{
  "summary": "検索結果の要約（2〜3文。情報の出典や注意点を含める）",
  "hospitals": [
    {
      "name": "医療機関名",
      "address": "住所",
      "phone": "電話番号",
      "department": "診療科",
      "hours": "診療時間",
      "latitude": 35.0,
      "longitude": 139.0
    }
  ]
}`;
};

const extractJson = (text: string): unknown => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(candidate);
};

const toHospitals = (value: unknown): Hospital[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object' && typeof h.name === 'string')
    .map((h) => ({
      name: h.name as string,
      address: typeof h.address === 'string' ? h.address : undefined,
      phone: typeof h.phone === 'string' ? h.phone : undefined,
      department: typeof h.department === 'string' ? h.department : undefined,
      hours: typeof h.hours === 'string' ? h.hours : undefined,
      latitude: typeof h.latitude === 'number' ? h.latitude : undefined,
      longitude: typeof h.longitude === 'number' ? h.longitude : undefined,
    }));
};

export const fetchTobanI = async (prefectureName: string): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。環境変数 GEMINI_API_KEY を設定してください。');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(prefectureName),
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? '';

  let hospitals: Hospital[] = [];
  let summary = '';
  try {
    const parsed = extractJson(text) as { summary?: unknown; hospitals?: unknown };
    hospitals = toHospitals(parsed.hospitals);
    summary = typeof parsed.summary === 'string' ? parsed.summary : '';
  } catch {
    // JSONで返らなかった場合は本文をそのまま要約として表示する
    summary = text.trim();
  }

  if (!summary && hospitals.length === 0) {
    throw new Error('当番医の情報を取得できませんでした。時間をおいて再試行してください。');
  }

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const groundingSources: GroundingSource[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    groundingSources.push({ title: chunk.web?.title || uri, uri });
  }

  return { hospitals, groundingSources, summary };
};
