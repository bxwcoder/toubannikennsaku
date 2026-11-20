// ヒント機能の自動テスト
import { describe, expect, it } from 'vitest';
import { getHint } from './hint';
import { PUZZLES } from './puzzles';
import { isCleared } from './rules';
import { countSolutions } from './solver';
import type { CellState } from './types';

describe('ヒント', () => {
  for (const p of PUZZLES) {
    it(`問題${p.id}: ヒントの通りに進めるだけでクリアできる`, () => {
      const cells: CellState[] = new Array(p.size * p.size).fill('empty');
      for (let k = 0; k < 200 && !isCleared(cells, p); k++) {
        const h = getHint(p, cells);
        expect(h.kind).not.toBe('wrong');
        for (const i of h.cells) cells[i] = h.kind === 'place' ? 'kamon' : 'mark';
      }
      expect(isCleared(cells, p)).toBe(true);
    });
  }

  it('間違った家紋があれば、まずそれを指摘する', () => {
    const p = PUZZLES[0];
    const cells: CellState[] = new Array(p.size * p.size).fill('empty');
    const wrong = p.solution[0] === 0 ? 1 : 0; // 1行目の正解ではないマス
    cells[wrong] = 'kamon';
    expect(getHint(p, cells)).toMatchObject({ kind: 'wrong', cells: [wrong] });
  });

  it('正解のマスに×があれば指摘する', () => {
    const p = PUZZLES[0];
    const cells: CellState[] = new Array(p.size * p.size).fill('empty');
    cells[p.solution[0]] = 'mark';
    expect(getHint(p, cells)).toMatchObject({ kind: 'wrong', cells: [p.solution[0]] });
  });

  it('遊び方の画面の例の盤面も、答えが1通り', () => {
    expect(countSolutions(4, [0, 0, 1, 1, 2, 0, 1, 1, 2, 2, 3, 1, 2, 3, 3, 3], Infinity)).toBe(1);
  });
});
