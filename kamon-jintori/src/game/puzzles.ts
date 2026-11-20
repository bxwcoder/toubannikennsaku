// 問題集の読み込み
// 問題データは tools/generate.ts で自動生成し、src/game/data/ に保存している。
// すべての問題は puzzles.test.ts で「解答がちょうど1通り・推理だけで解ける」ことを確認している。
import type { Puzzle } from './types';
import data6 from './data/puzzles-6x6.json';

/** 問題集ファイルに保存されている1問の形 */
export interface PuzzleRecord {
  /** 生成に使った種番号（同じ番号で同じ問題を作り直せる） */
  seed: number;
  /** 各マスのエリアを A, B, C... の文字で並べたもの（左上から行ごと） */
  regions: string;
  /** 各行の家紋の列番号（0始まり）をカンマ区切りで */
  solution: string;
  /** 必要な推理の段階（★の数） */
  technique: number;
  /** 難しさの点数 */
  score?: number;
}

function toPuzzles(records: PuzzleRecord[]): Puzzle[] {
  return records.map((r, idx) => ({
    id: idx + 1,
    key: `${Math.round(Math.sqrt(r.regions.length))}-${r.seed}`,
    size: Math.round(Math.sqrt(r.regions.length)),
    regions: [...r.regions].map((ch) => ch.charCodeAt(0) - 65),
    solution: r.solution.split(',').map(Number),
    technique: r.technique,
  }));
}

/** 難易度ごとの問題集（中級8×8・上級10×10は後で追加） */
export const PUZZLE_SETS = {
  beginner: { label: '初級', size: 6, puzzles: toPuzzles(data6) },
} as const;

/** 今遊べる問題（初級） */
export const PUZZLES: Puzzle[] = PUZZLE_SETS.beginner.puzzles;
