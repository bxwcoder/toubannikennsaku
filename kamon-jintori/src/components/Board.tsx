// 盤面の表示とタップ操作
import type { CellState, Puzzle } from '../game/types';
import { Kamon } from './Kamon';

// エリアの色（落ち着いた和の色）。10×10まで使えるよう10色用意
const REGION_COLORS = [
  '#f2d7d5', // 桜色
  '#d3e4cd', // 若竹色
  '#ddd5ea', // 藤色
  '#f5e3b3', // 山吹色（淡）
  '#cfe5e8', // 浅葱色（淡）
  '#efd5c3', // 薄柿色
  '#e3e6c5', // 鶯色（淡）
  '#e6dcd8', // 灰桜色
  '#d6e0ee', // 白藍色
  '#ebe2cc', // 砂色
];

interface Props {
  puzzle: Puzzle;
  cells: CellState[];
  violations: Set<number>;
  cleared: boolean;
  onTap: (index: number) => void;
}

export function Board({ puzzle, cells, violations, cleared, onTap }: Props) {
  const n = puzzle.size;
  const reg = puzzle.regions;
  const THICK = '1.5px solid #3b2f2a';
  const THIN = '0.5px solid rgba(59,47,42,0.25)';

  return (
    <div
      className={`board ${cleared ? 'board-cleared' : ''}`}
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      role="grid"
      aria-label={`${n}×${n}の盤面`}
    >
      {cells.map((state, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        // 隣のマスと別のエリアなら太線、同じエリアなら細線
        const border = (other: number | null) => (other === null || reg[other] !== reg[i] ? THICK : THIN);
        const bad = violations.has(i);
        return (
          <button
            key={i}
            className={`cell ${bad ? 'cell-bad' : ''}`}
            style={{
              background: REGION_COLORS[reg[i] % REGION_COLORS.length],
              borderTop: border(r > 0 ? i - n : null),
              borderBottom: border(r < n - 1 ? i + n : null),
              borderLeft: border(c > 0 ? i - 1 : null),
              borderRight: border(c < n - 1 ? i + 1 : null),
              animationDelay: cleared ? `${(r + c) * 60}ms` : undefined,
            }}
            onClick={() => onTap(i)}
            disabled={cleared}
            aria-label={`${r + 1}行${c + 1}列 ${state === 'kamon' ? '家紋' : state === 'mark' ? '×' : '空'}`}
          >
            {state === 'kamon' && (
              <span className="kamon">
                <Kamon color={bad ? '#c0392b' : '#2e2622'} />
              </span>
            )}
            {state === 'mark' && <span className="mark">×</span>}
          </button>
        );
      })}
    </div>
  );
}
