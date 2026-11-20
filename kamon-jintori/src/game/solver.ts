// 解答を数えるプログラム（問題を作るプログラムとは別）
// 問題のエリア配置だけを見て、ルールを満たす家紋の置き方が何通りあるかを数える。
import type { Puzzle } from './types';

/**
 * 解答の数を数える。limit 個見つかった時点で数えるのをやめる
 * （「1通りかどうか」を知りたいだけなら limit=2 で十分）。
 */
export function countSolutions(size: number, regions: number[], limit = 2): number {
  const colUsed = new Array<boolean>(size).fill(false);
  const regionUsed = new Array<boolean>(size).fill(false);
  let count = 0;

  // 上の行から順に、家紋を置ける列を試していく
  const search = (row: number, prevCol: number): boolean => {
    if (row === size) {
      count++;
      return count >= limit;
    }
    for (let col = 0; col < size; col++) {
      if (colUsed[col]) continue;
      if (prevCol >= 0 && Math.abs(prevCol - col) === 1) continue; // 斜め隣接
      const region = regions[row * size + col];
      if (regionUsed[region]) continue;
      colUsed[col] = regionUsed[region] = true;
      if (search(row + 1, col)) return true;
      colUsed[col] = regionUsed[region] = false;
    }
    return false;
  };

  search(0, -1);
  return count;
}

/** 解答を1つ見つけて返す（なければ null） */
export function findSolution(size: number, regions: number[]): number[] | null {
  const colUsed = new Array<boolean>(size).fill(false);
  const regionUsed = new Array<boolean>(size).fill(false);
  const cols: number[] = [];
  const search = (row: number): boolean => {
    if (row === size) return true;
    for (let col = 0; col < size; col++) {
      if (colUsed[col]) continue;
      if (row > 0 && Math.abs(cols[row - 1] - col) === 1) continue;
      const region = regions[row * size + col];
      if (regionUsed[region]) continue;
      colUsed[col] = regionUsed[region] = true;
      cols[row] = col;
      if (search(row + 1)) return true;
      colUsed[col] = regionUsed[region] = false;
    }
    return false;
  };
  return search(0) ? [...cols] : null;
}

/** 問題として正しいか（エリア数が正しい・各エリアがつながっている・解答がちょうど1つ） */
export function validatePuzzle(p: Puzzle): string[] {
  const errors: string[] = [];
  const n = p.size;
  if (p.regions.length !== n * n) errors.push('マスの数が盤面サイズと合いません');
  const ids = new Set(p.regions);
  if (ids.size !== n || [...ids].some((r) => r < 0 || r >= n)) errors.push(`エリアの数が ${n} 個ではありません`);
  for (const r of ids) if (!isConnected(n, p.regions, r)) errors.push(`エリア ${r} がつながっていません`);
  const count = countSolutions(n, p.regions, 2);
  if (count !== 1) errors.push(`解答が ${count === 2 ? '2通り以上' : '0通り'} あります`);
  const sol = findSolution(n, p.regions);
  if (count === 1 && sol && sol.join() !== p.solution.join()) errors.push('記録された正解と一致しません');
  return errors;
}

function isConnected(n: number, regions: number[], id: number): boolean {
  const cells = regions.flatMap((r, i) => (r === id ? [i] : []));
  if (cells.length === 0) return false;
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const i = stack.pop()!;
    const r = Math.floor(i / n), c = i % n;
    const around = [r > 0 ? i - n : -1, r < n - 1 ? i + n : -1, c > 0 ? i - 1 : -1, c < n - 1 ? i + 1 : -1];
    for (const j of around) {
      if (j >= 0 && regions[j] === id && !seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return seen.size === cells.length;
}
