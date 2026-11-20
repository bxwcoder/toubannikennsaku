// ゲーム全体で使う「データの形」の定義

/** 1つの問題 */
export interface Puzzle {
  /** 問題番号（1から） */
  id: number;
  /** 盤面の一辺のマス数（6, 8, 10 など） */
  size: number;
  /** 各マスがどのエリアに属するか。左上から右へ、行ごとに並べたもの（長さ size*size） */
  regions: number[];
  /** 正解。solution[行] = 家紋がある列番号 */
  solution: number[];
  /** 解くのに必要な推理の段階（1〜3）。難易度の目安 */
  technique: number;
}

/** マスの状態: 空 / ×メモ / 家紋 */
export type CellState = 'empty' | 'mark' | 'kamon';
