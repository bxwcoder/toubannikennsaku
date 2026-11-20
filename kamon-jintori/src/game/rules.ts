// ルール判定（違反チェックとクリア判定）
import type { CellState, Puzzle } from './types';

export const rowOf = (i: number, n: number) => Math.floor(i / n);
export const colOf = (i: number, n: number) => i % n;

/** 2つのマスに同時に家紋を置くとルール違反になるか */
export function conflicts(a: number, b: number, puzzle: Puzzle): boolean {
  const n = puzzle.size;
  if (a === b) return false;
  const ra = rowOf(a, n), ca = colOf(a, n), rb = rowOf(b, n), cb = colOf(b, n);
  if (ra === rb) return true; // 同じ横列
  if (ca === cb) return true; // 同じ縦列
  if (puzzle.regions[a] === puzzle.regions[b]) return true; // 同じエリア
  if (Math.abs(ra - rb) === 1 && Math.abs(ca - cb) === 1) return true; // 斜めに隣接
  return false;
}

/** ルール違反になっている家紋のマス番号の集まり */
export function findViolations(cells: CellState[], puzzle: Puzzle): Set<number> {
  const kamons = cells.flatMap((s, i) => (s === 'kamon' ? [i] : []));
  const bad = new Set<number>();
  for (let x = 0; x < kamons.length; x++) {
    for (let y = x + 1; y < kamons.length; y++) {
      if (conflicts(kamons[x], kamons[y], puzzle)) {
        bad.add(kamons[x]);
        bad.add(kamons[y]);
      }
    }
  }
  return bad;
}

/** クリアしたか: 家紋がちょうど盤面サイズ個あり、違反が1つもない */
export function isCleared(cells: CellState[], puzzle: Puzzle): boolean {
  const count = cells.filter((s) => s === 'kamon').length;
  return count === puzzle.size && findViolations(cells, puzzle).size === 0;
}

/** タップしたときの状態の移り変わり: 空 → × → 家紋 → 空 */
export function nextState(s: CellState): CellState {
  return s === 'empty' ? 'mark' : s === 'mark' ? 'kamon' : 'empty';
}
