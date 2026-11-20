// 自動テスト: 収録されている全問題が正しいかを確認する（npm test で実行）
import { describe, expect, it } from 'vitest';
import { PUZZLES } from './puzzles';
import { countSolutions, validatePuzzle } from './solver';
import { findViolations, isCleared } from './rules';
import type { CellState } from './types';
import { solveByLogic } from './logic';
import { generatePuzzle } from './generator';

describe('収録問題', () => {
  for (const p of PUZZLES) {
    it(`問題${p.id}: エリア数・つながり・解答1通り`, () => {
      expect(validatePuzzle(p)).toEqual([]);
      // 打ち切り無しで全部数えても1通り
      expect(countSolutions(p.size, p.regions, Infinity)).toBe(1);
    });
    it(`問題${p.id}: 推理だけで解けて、★${p.technique}の難しさ`, () => {
      const logic = solveByLogic(p);
      expect(logic.solved).toBe(true);
      expect(logic.maxTechnique).toBe(p.technique);
      // 推理で置いた家紋が正解と一致する
      const placed = logic.steps.filter((s) => s.kind === 'place').flatMap((s) => s.cells).sort((a, b) => a - b);
      const answer = p.solution.map((c, r) => r * p.size + c).sort((a, b) => a - b);
      expect(placed).toEqual(answer);
    });
  }
});

describe('収録問題全体', () => {
  it('30問あり、易しい順（★の数が減らない）に並んでいる', () => {
    expect(PUZZLES.length).toBe(30);
    for (let i = 1; i < PUZZLES.length; i++) expect(PUZZLES[i].technique).toBeGreaterThanOrEqual(PUZZLES[i - 1].technique);
  });
  it('同じ問題が重複していない', () => {
    expect(new Set(PUZZLES.map((p) => p.regions.join())).size).toBe(PUZZLES.length);
  });
});

describe('問題生成プログラム', () => {
  for (const size of [6, 8, 10]) {
    it(`${size}×${size}: 作った問題はすべて解答がちょうど1通りで、記録した正解と一致する`, () => {
      let made = 0;
      for (let seed = 1; seed <= (size === 10 ? 3 : 20); seed++) {
        const g = generatePuzzle(size, seed);
        if (!g) continue;
        made++;
        expect(validatePuzzle({ ...g, id: 0, technique: 0 })).toEqual([]);
      }
      expect(made).toBeGreaterThan(0);
    }, 60000);
  }
  it('同じ種番号からは同じ問題ができる', () => {
    expect(generatePuzzle(6, 42)).toEqual(generatePuzzle(6, 42));
  });
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
