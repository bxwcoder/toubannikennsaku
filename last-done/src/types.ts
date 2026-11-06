// アプリで使うデータの形をまとめたファイル

export const CATEGORIES = [
  '家事・掃除',
  '消耗品交換',
  '美容・健康',
  'ペット',
  '車・バイク',
  'その他',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 登録した1つの項目 */
export interface Item {
  id: string;
  name: string;
  category: Category;
  /** 最後にやった日（例: "2026-11-06"） */
  lastDate: string;
  /** 次回の目安日数。設定しない場合は null */
  intervalDays: number | null;
  createdAt: string;
}

/** 並べ替えの種類 */
export type SortKey = 'elapsedDesc' | 'elapsedAsc' | 'name' | 'dueSoon';

export const SORT_LABELS: Record<SortKey, string> = {
  elapsedDesc: '経過日数が長い順',
  elapsedAsc: '経過日数が短い順',
  name: '項目名順',
  dueSoon: '目安が近い順',
};

/** 目安に対する状態 */
export type Status = 'ok' | 'soon' | 'over' | 'none';
