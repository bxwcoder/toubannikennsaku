// テンプレート（よく使う項目）の一覧
// 目安日数は一般的な目安の仮の値。選んだあとに自由に変更できる
import type { Category } from '../types';

export interface Template {
  name: string;
  category: Category;
  intervalDays: number;
}

export const TEMPLATES: Template[] = [
  { name: '排水口の掃除', category: '家事・掃除', intervalDays: 7 },
  { name: '換気扇の掃除', category: '家事・掃除', intervalDays: 90 },
  { name: '洗濯槽の掃除', category: '家事・掃除', intervalDays: 30 },
  { name: 'エアコンフィルターの掃除', category: '家事・掃除', intervalDays: 14 },
  { name: 'シーツの交換', category: '家事・掃除', intervalDays: 7 },
  { name: '浄水器カートリッジの交換', category: '消耗品交換', intervalDays: 90 },
  { name: '歯ブラシの交換', category: '消耗品交換', intervalDays: 30 },
  { name: 'コンタクトレンズの交換', category: '美容・健康', intervalDays: 14 },
  { name: 'ペットの爪切り', category: 'ペット', intervalDays: 14 },
  { name: '洗車', category: '車・バイク', intervalDays: 30 },
  { name: 'エンジンオイル交換', category: '車・バイク', intervalDays: 180 },
];
