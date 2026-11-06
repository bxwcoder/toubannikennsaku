// データの保存・書き出し・読み込みをまとめたファイル
// 保存先はブラウザ内の保存領域（localStorage）。画面を閉じても残る
import { CATEGORIES, type Category, type Item, type SortKey, SORT_LABELS } from '../types';
import { isValidDateString } from './date';

const ITEMS_KEY = 'last-done:items:v1';
const SORT_KEY = 'last-done:sort:v1';
const APP_ID = 'last-done';
const DATA_VERSION = 1;

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeItem).filter((x): x is Item => x !== null) : [];
  } catch {
    return [];
  }
}

/** 保存に成功したら true */
export function saveItems(items: Item[]): boolean {
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function loadSort(): SortKey {
  try {
    const value = localStorage.getItem(SORT_KEY);
    if (value && value in SORT_LABELS) return value as SortKey;
  } catch {
    // 読めないときは初期値を使う
  }
  return 'elapsedDesc';
}

export function saveSort(key: SortKey): void {
  try {
    localStorage.setItem(SORT_KEY, key);
  } catch {
    // 並べ替えの記憶は失敗しても困らないので無視する
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 読み込んだデータを点検して、正しい形の項目だけを返す */
function normalizeItem(value: unknown): Item | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const name = typeof v.name === 'string' ? v.name.trim() : '';
  if (!name || !isValidDateString(v.lastDate)) return null;

  const category: Category = CATEGORIES.includes(v.category as Category) ? (v.category as Category) : 'その他';
  const interval =
    typeof v.intervalDays === 'number' && Number.isInteger(v.intervalDays) && v.intervalDays >= 1
      ? v.intervalDays
      : null;

  return {
    id: typeof v.id === 'string' && v.id ? v.id : newId(),
    name: name.slice(0, 40),
    category,
    lastDate: v.lastDate,
    intervalDays: interval,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : new Date().toISOString(),
  };
}

/** 書き出し: バックアップ用のファイルをダウンロードする */
export function exportItems(items: Item[], today: string): void {
  const data = {
    app: APP_ID,
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    items,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `last-done-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 読み込み: ファイルの中身を点検して項目の一覧に変える。おかしなファイルならエラーにする */
export function parseBackup(text: string): Item[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('ファイルの形式が正しくありません。このアプリで書き出したファイルを選んでください。');
  }

  const data = parsed as Record<string, unknown> | null;
  if (!data || data.app !== APP_ID || !Array.isArray(data.items)) {
    throw new Error('このアプリのバックアップファイルではないようです。');
  }

  const items = data.items.map(normalizeItem).filter((x): x is Item => x !== null);
  if (data.items.length > 0 && items.length === 0) {
    throw new Error('ファイルの中に読み込める項目がありませんでした。');
  }

  // 同じ id が重なっていたら付け直す
  const seen = new Set<string>();
  return items.map((item) => {
    if (seen.has(item.id)) item = { ...item, id: newId() };
    seen.add(item.id);
    return item;
  });
}
