// 問題を作るプログラム（解答を数えるプログラム solver.ts とは別）
// 手順:
//  1. ルールを満たす家紋の配置（正解）を先に決める
//  2. 各家紋を「種」にしてエリアを広げる
//  3. 解答の数を数え、2通り以上ならエリアの境目を動かして調整
//  4. 解答がちょうど1通りになったら完成
import { countSolutions, findTwoSolutions } from './solver';
import type { Puzzle } from './types';

/** 同じ番号を渡すと毎回同じ問題が作られる乱数（問題を再現できるようにするため） */
export function createRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Random = () => number;

const pick = <T,>(arr: T[], rand: Random) => arr[Math.floor(rand() * arr.length)];
function shuffle<T>(arr: T[], rand: Random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 上下左右の隣のマス */
function neighbors(n: number, i: number): number[] {
  const r = Math.floor(i / n), c = i % n;
  const out: number[] = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}

/** 1. 正解の配置をランダムに作る（各行・各列に1つ、斜めに隣接しない） */
export function randomSolution(n: number, rand: Random): number[] {
  const cols: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const search = (row: number): boolean => {
    if (row === n) return true;
    for (const c of shuffle([...Array(n).keys()], rand)) {
      if (used[c] || (row > 0 && Math.abs(cols[row - 1] - c) === 1)) continue;
      used[c] = true;
      cols[row] = c;
      if (search(row + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  search(0);
  return cols;
}

/** 2. 家紋を種にしてエリアを広げる */
function growRegions(n: number, solution: number[], rand: Random): number[] {
  const regions = new Array<number>(n * n).fill(-1);
  // エリア番号は、ばらつきが出るようにシャッフルして割り当てる
  const ids = shuffle([...Array(n).keys()], rand);
  solution.forEach((c, row) => (regions[row * n + c] = ids[row]));
  let left = n * n - n;
  while (left > 0) {
    const i = Math.floor(rand() * n * n);
    if (regions[i] !== -1) continue;
    const ns = neighbors(n, i).filter((j) => regions[j] !== -1);
    if (ns.length === 0) continue;
    regions[i] = regions[pick(ns, rand)];
    left--;
  }
  return regions;
}

function isRegionConnected(n: number, regions: number[], id: number): boolean {
  const cells = regions.flatMap((r, i) => (r === id ? [i] : []));
  if (cells.length === 0) return false;
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const i = stack.pop()!;
    for (const j of neighbors(n, i)) {
      if (regions[j] === id && !seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * 問題を1つ作る。作れなかったら null。
 * seed（種番号）が同じなら、必ず同じ問題になる。
 */
export function generatePuzzle(size: number, seed: number, maxSteps = 4000): Omit<Puzzle, 'id' | 'technique'> | null {
  const rand = createRandom(seed);
  const solution = randomSolution(size, rand);
  const regions = growRegions(size, solution, rand);
  const answerCells = new Set(solution.map((c, row) => row * size + c));

  for (let step = 0; step < maxSteps; step++) {
    const found = findTwoSolutions(size, regions);
    if (found.length === 1) return { size, regions, solution };

    // 3. 2つ目の答えを壊すように調整する:
    //    2つ目の答えにだけ出てくる家紋マスを選び、隣のエリアに移す
    const other = found.find((s) => s.join() !== solution.join()) ?? found[0];
    const candidates = other.map((c, row) => row * size + c).filter((i) => !answerCells.has(i));
    // ときどき完全にランダムなマスも動かして、行き詰まりを防ぐ
    const cell = rand() < 0.7 && candidates.length ? pick(candidates, rand) : Math.floor(rand() * size * size);
    if (answerCells.has(cell)) continue;
    const ns = neighbors(size, cell).filter((j) => regions[j] !== regions[cell]);
    if (ns.length === 0) continue;
    const old = regions[cell];
    regions[cell] = regions[pick(ns, rand)];
    if (!isRegionConnected(size, regions, old)) regions[cell] = old; // エリアが分断されるなら元に戻す
  }
  // 念のため: 最後にもう一度数える
  return countSolutions(size, regions, 2) === 1 ? { size, regions, solution } : null;
}
