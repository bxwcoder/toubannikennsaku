// プレイデータを端末の中に保存する（サーバーは使わない）
// 保存するもの: 各問題の記録（ベストタイムなど）、設定、遊びかけの盤面
import type { CellState } from '../game/types';

const STORAGE_KEY = 'kamon-jintori:v1';

export interface PuzzleResult {
  /** ベストタイム（秒） */
  bestTime: number;
  /** ベストタイムのときに使ったヒントの数 */
  hintsUsed: number;
  /** クリアした回数 */
  clearCount: number;
}

export interface Settings {
  sound: boolean;
  showTimer: boolean;
}

export interface Progress {
  key: string;
  cells: CellState[];
  elapsed: number;
  hintsUsed: number;
}

export interface SaveData {
  version: 1;
  results: Record<string, PuzzleResult>;
  settings: Settings;
  /** 合計クリア数（広告を数問ごとに出すときに使う） */
  totalClears: number;
}

const DEFAULT_DATA: SaveData = {
  version: 1,
  results: {},
  settings: { sound: true, showTimer: true },
  totalClears: 0,
};

// 端末によっては保存が使えない場合もあるので、失敗してもゲームは止めない
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 保存できなくても遊べるようにする */
  }
}

export function loadData(): SaveData {
  const saved = read<SaveData>(STORAGE_KEY);
  if (!saved || saved.version !== 1) return structuredClone(DEFAULT_DATA);
  return { ...DEFAULT_DATA, ...saved, settings: { ...DEFAULT_DATA.settings, ...saved.settings } };
}

export function saveData(data: SaveData) {
  write(STORAGE_KEY, data);
}

/** クリアを記録する。新記録なら isNewBest = true */
export function recordClear(data: SaveData, key: string, time: number, hintsUsed: number) {
  const prev = data.results[key];
  const isNewBest = !prev || time < prev.bestTime;
  const result: PuzzleResult = {
    bestTime: isNewBest ? time : prev.bestTime,
    hintsUsed: isNewBest ? hintsUsed : prev.hintsUsed,
    clearCount: (prev?.clearCount ?? 0) + 1,
  };
  const next: SaveData = {
    ...data,
    results: { ...data.results, [key]: result },
    totalClears: data.totalClears + 1,
  };
  return { data: next, isNewBest, previousBest: prev?.bestTime ?? null };
}

// 遊びかけの盤面（アプリを閉じても続きから遊べるように、1問分だけ保存）
const PROGRESS_KEY = 'kamon-jintori:progress';
export const loadProgress = () => read<Progress>(PROGRESS_KEY);
export const saveProgress = (p: Progress) => write(PROGRESS_KEY, p);
export function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* 何もしない */
  }
}

export function resetAllData() {
  clearProgress();
  const fresh = structuredClone(DEFAULT_DATA);
  saveData(fresh);
  return fresh;
}

/** 秒数を「分:秒」の形にする */
export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
