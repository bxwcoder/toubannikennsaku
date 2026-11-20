// ヒントの中身を決めるプログラム
// 今の盤面から「次に推理で決められること」を1つ探して、マスと理由を返す。
import { LogicBoard } from './logic';
import type { CellState, Puzzle } from './types';

export interface Hint {
  /** wrong: 間違いの指摘 / place: 家紋が置ける / eliminate: ×が付けられる */
  kind: 'wrong' | 'place' | 'eliminate';
  /** 光らせるマス */
  cells: number[];
  /** 表示する説明文 */
  message: string;
}

export function getHint(puzzle: Puzzle, cells: CellState[]): Hint {
  const n = puzzle.size;
  const answer = new Set(puzzle.solution.map((c, r) => r * n + c));

  // 1. 間違って置いた家紋があれば、まずそれを教える
  const wrongKamon = cells.findIndex((s, i) => s === 'kamon' && !answer.has(i));
  if (wrongKamon >= 0) {
    return { kind: 'wrong', cells: [wrongKamon], message: 'この家紋は正しい位置ではありません。取り除いて考え直してみましょう。' };
  }
  // 2. 正解のマスに×を付けていたら教える
  const wrongMark = cells.findIndex((s, i) => s === 'mark' && answer.has(i));
  if (wrongMark >= 0) {
    return { kind: 'wrong', cells: [wrongMark], message: 'この×は間違っています。消してから考え直してみましょう。' };
  }

  // 3. 今の盤面（置いた家紋と×）をもとに、次の推理を探す
  const board = new LogicBoard(puzzle);
  cells.forEach((s, i) => s === 'kamon' && board.place(i));
  cells.forEach((s, i) => {
    if (s === 'mark') board.possible[i] = false;
  });
  const step = board.findStep();
  if (step) {
    return step.kind === 'place'
      ? { kind: 'place', cells: step.cells, message: `${step.reason}。光っているマスに家紋を置けます。` }
      : { kind: 'eliminate', cells: step.cells, message: `${step.reason}。光っているマスに×を付けましょう。` };
  }

  // 4. 念のための予備（通常は使われない）: まだ置いていない正解のマスを1つ教える
  const next = [...answer].find((i) => cells[i] !== 'kamon')!;
  return { kind: 'place', cells: [next], message: '光っているマスに家紋が入ります。' };
}
