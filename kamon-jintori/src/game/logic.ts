// 人間の推理で解けるかを確かめるプログラム
// 当てずっぽうをせず、決まった「手筋」だけで解き進める。
// ・どの手筋が必要だったか → 難易度（★の数）
// ・次に使える手筋 → ヒント機能（STEP 4）で利用
import { conflicts } from './rules';
import type { Puzzle } from './types';

/** 推理の1手 */
export interface LogicStep {
  /** place: 家紋が決まる / eliminate: 家紋を置けないマスが分かる */
  kind: 'place' | 'eliminate';
  /** 対象のマス番号 */
  cells: number[];
  /** 使った手筋（1〜3） */
  technique: 1 | 2 | 3;
  /** 説明文（ヒントで表示する） */
  reason: string;
}

export interface LogicResult {
  solved: boolean;
  steps: LogicStep[];
  /** 必要だった一番難しい手筋 */
  maxTechnique: number;
  /** 難しさの点数（手筋ごとの重みの合計） */
  score: number;
}

/** 家紋を置ける可能性のあるマスの情報を持つ「推理ノート」 */
export class LogicBoard {
  readonly n: number;
  /** true = まだ家紋を置ける可能性がある */
  readonly possible: boolean[];
  readonly placed = new Set<number>();
  /** 横列・縦列・エリアの「グループ」一覧（各グループに家紋は1つ） */
  readonly groups: { name: string; cells: number[] }[];

  constructor(readonly puzzle: Puzzle) {
    const n = (this.n = puzzle.size);
    this.possible = new Array(n * n).fill(true);
    const all = [...Array(n * n).keys()];
    this.groups = [];
    for (let k = 0; k < n; k++) {
      this.groups.push({ name: `${k + 1}行目`, cells: all.filter((i) => Math.floor(i / n) === k) });
      this.groups.push({ name: `${k + 1}列目`, cells: all.filter((i) => i % n === k) });
      this.groups.push({ name: 'このエリア', cells: all.filter((i) => puzzle.regions[i] === k) });
    }
  }

  place(i: number) {
    this.placed.add(i);
    for (let j = 0; j < this.possible.length; j++) {
      if (j !== i && conflicts(i, j, this.puzzle)) this.possible[j] = false;
    }
  }

  /** グループにすでに家紋があるか */
  done(cells: number[]) {
    return cells.some((i) => this.placed.has(i));
  }
  /** グループの中で、まだ家紋を置ける（未確定の）マス */
  open(cells: number[]) {
    return cells.filter((i) => this.possible[i] && !this.placed.has(i));
  }

  /** 次に使える推理を1つ探す（易しい手筋から順に） */
  findStep(maxTechnique = 3): LogicStep | null {
    return this.technique1() ?? (maxTechnique >= 2 ? this.technique2() : null) ?? (maxTechnique >= 3 ? this.technique3() : null);
  }

  /** 手筋1: あるグループで置ける場所が1か所だけ → そこに決まる */
  private technique1(): LogicStep | null {
    for (const g of this.groups) {
      if (this.done(g.cells)) continue;
      const open = this.open(g.cells);
      if (open.length === 1) {
        return { kind: 'place', cells: open, technique: 1, reason: `${g.name}で家紋を置ける場所はここだけです` };
      }
    }
    return null;
  }

  /** 手筋2: そこに置くと、別のグループの置き場所が全部なくなる → そこには置けない */
  private technique2(): LogicStep | null {
    for (let i = 0; i < this.possible.length; i++) {
      if (!this.possible[i] || this.placed.has(i)) continue;
      for (const g of this.groups) {
        if (this.done(g.cells) || g.cells.includes(i)) continue;
        const open = this.open(g.cells);
        if (open.length > 0 && open.every((j) => conflicts(i, j, this.puzzle))) {
          return {
            kind: 'eliminate',
            cells: [i],
            technique: 2,
            reason: `ここに置くと、${g.name}に家紋を置ける場所がなくなります`,
          };
        }
      }
    }
    return null;
  }

  /** 手筋3: k個のエリアがk本の行（列）の中に収まる → その行（列）の他のマスには置けない */
  private technique3(): LogicStep | null {
    const n = this.n;
    const reg = this.puzzle.regions;
    for (const axis of ['行', '列'] as const) {
      const lineOf = (i: number) => (axis === '行' ? Math.floor(i / n) : i % n);
      for (let mask = 1; mask < 1 << n; mask++) {
        const lines = [...Array(n).keys()].filter((k) => (mask >> k) & 1);
        if (lines.length < 2 || lines.length > n - 2) continue;
        const inside: number[] = [];
        for (let g = 0; g < n; g++) {
          const cells = this.groups[g * 3 + 2].cells;
          if (this.done(cells)) continue;
          const open = this.open(cells);
          if (open.length > 0 && open.every((i) => lines.includes(lineOf(i)))) inside.push(g);
        }
        if (inside.length !== lines.length) continue;
        const targets = this.possible
          .map((_, i) => i)
          .filter((i) => this.possible[i] && !this.placed.has(i) && lines.includes(lineOf(i)) && !inside.includes(reg[i]));
        if (targets.length > 0) {
          const names = lines.map((k) => k + 1).join('・');
          return {
            kind: 'eliminate',
            cells: targets,
            technique: 3,
            reason: `${lines.length}つのエリアが${names}${axis}目の中に収まるので、その${axis}の他のマスには置けません`,
          };
        }
      }
    }
    return null;
  }

  apply(step: LogicStep) {
    if (step.kind === 'place') step.cells.forEach((i) => this.place(i));
    else step.cells.forEach((i) => (this.possible[i] = false));
  }
}

const WEIGHT = { 1: 1, 2: 3, 3: 10 } as const;

/** 推理だけで最後まで解いてみる */
export function solveByLogic(puzzle: Puzzle): LogicResult {
  const board = new LogicBoard(puzzle);
  const steps: LogicStep[] = [];
  while (board.placed.size < puzzle.size) {
    const step = board.findStep();
    if (!step) break;
    board.apply(step);
    steps.push(step);
  }
  const solved = board.placed.size === puzzle.size;
  const maxTechnique = steps.reduce((m, s) => Math.max(m, s.technique), 0);
  const score = steps.reduce((sum, s) => sum + WEIGHT[s.technique], 0);
  return { solved, steps, maxTechnique, score };
}
