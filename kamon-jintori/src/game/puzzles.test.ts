// 自動テスト: 収録されている全問題が正しいかを確認する（npm test で実行）
import { describe, expect, it } from 'vitest';
import { PUZZLES } from './puzzles';
import { countSolutions, validatePuzzle } from './solver';
import { findViolations, isCleared } from './rules';
import type { CellState } from './types';

describe('収録問題', () => {
  for (const p of PUZZLES) {
    it(`問題${p.id}: エリア数・つながり・解答1通り`, () => {
      expect(validatePuzzle(p)).toEqual([]);
      // 打ち切り無しで全部数えても1通り
      expect(countSolutions(p.size, p.regions, Infinity)).toBe(1);
    });
  }
});

describe('ルール判定', () => {
  const p = PUZZLES[0];
  const n = p.size;
  const empty = (): CellState[] => new Array(n * n).fill('empty');

  it('正解どおりに置くとクリア', () => {
    const cells = empty();
    p.solution.forEach((c, r) => (cells[r * n + c] = 'kamon'));
    expect(isCleared(cells, p)).toBe(true);
  });

  it('同じ横列に2つ置くと違反', () => {
    const cells = empty();
    cells[0] = cells[3] = 'kamon';
    expect(findViolations(cells, p)).toEqual(new Set([0, 3]));
  });

  it('斜めに隣接すると違反', () => {
    const cells = empty();
    cells[0] = cells[n + 1] = 'kamon';
    expect(findViolations(cells, p).size).toBe(2);
  });

  it('×メモは判定に影響しない', () => {
    const cells = empty();
    p.solution.forEach((c, r) => (cells[r * n + c] = 'kamon'));
    cells[1] = 'mark';
    expect(isCleared(cells, p)).toBe(true);
  });
});
