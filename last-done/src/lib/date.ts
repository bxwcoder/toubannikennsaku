// 日付の計算をまとめたファイル
// 日付は "2026-11-06" のような文字で保存し、時刻やタイムゾーンのずれが起きないようにしている

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** 今日の日付を "YYYY-MM-DD" で返す（スマホの時計の日付） */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" として正しい日付かどうか */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toDayNumber(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

/** from から to まで何日あるか（to が後なら正の数） */
export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** 日付に日数を足す */
export function addDays(value: string, days: number): string {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function weekday(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** 表示用: 2026/10/25（土） */
export function formatLong(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  return `${y}/${m}/${d}（${weekday(value)}）`;
}

/** 表示用: 今年なら 10/25（土）、それ以外は 2025/10/25（土） */
export function formatShort(value: string, today: string): string {
  const [y, m, d] = value.split('-').map(Number);
  const thisYear = Number(today.slice(0, 4));
  const prefix = y === thisYear ? '' : `${y}/`;
  return `${prefix}${m}/${d}（${weekday(value)}）`;
}

/** 経過日数の文字: 0 → "今日"、1 → "1日前" */
export function elapsedLabel(elapsed: number): string {
  return elapsed <= 0 ? '今日' : `${elapsed}日前`;
}
