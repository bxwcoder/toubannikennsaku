// ゲーム画面（STEP 2 の試作品）
import { useMemo, useState } from 'react';
import { Board } from './components/Board';
import { PUZZLES } from './game/puzzles';
import { findViolations, isCleared, nextState } from './game/rules';
import type { CellState } from './game/types';

const emptyCells = (size: number): CellState[] => new Array(size * size).fill('empty');

export default function App() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = PUZZLES[puzzleIndex];
  const [cells, setCells] = useState<CellState[]>(() => emptyCells(puzzle.size));
  // 「1手戻す」ために、これまでの盤面を順番に記録しておく
  const [history, setHistory] = useState<CellState[][]>([]);

  const violations = useMemo(() => findViolations(cells, puzzle), [cells, puzzle]);
  const cleared = useMemo(() => isCleared(cells, puzzle), [cells, puzzle]);
  const kamonCount = cells.filter((s) => s === 'kamon').length;

  const handleTap = (i: number) => {
    if (cleared) return;
    setHistory((h) => [...h, cells]);
    setCells(cells.map((s, j) => (j === i ? nextState(s) : s)));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setCells(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  const handleReset = () => {
    if (kamonCount === 0 && !cells.includes('mark')) return;
    setHistory((h) => [...h, cells]);
    setCells(emptyCells(puzzle.size));
  };

  const goTo = (index: number) => {
    const p = PUZZLES[index];
    setPuzzleIndex(index);
    setCells(emptyCells(p.size));
    setHistory([]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">家紋陣取り</h1>
        <p className="subtitle">
          第{puzzle.id}問　<span className="level">初級 {'★'.repeat(puzzle.technique)}</span>
        </p>
      </header>

      <main className="main">
        <p className={`status ${violations.size ? 'status-bad' : ''}`}>
          {cleared
            ? '見事、陣取り完了！'
            : violations.size
              ? '赤い家紋がルールに違反しています'
              : `家紋 ${kamonCount} / ${puzzle.size}`}
        </p>

        <Board puzzle={puzzle} cells={cells} violations={violations} cleared={cleared} onTap={handleTap} />

        {cleared ? (
          <div className="clear-box">
            {puzzleIndex < PUZZLES.length - 1 ? (
              <button className="btn btn-primary" onClick={() => goTo(puzzleIndex + 1)}>
                次の問題へ
              </button>
            ) : (
              <p>全問クリアしました！</p>
            )}
            <button className="btn" onClick={() => goTo(puzzleIndex)}>
              もう一度
            </button>
          </div>
        ) : (
          <div className="controls">
            <button className="btn" onClick={handleUndo} disabled={history.length === 0}>
              1手戻す
            </button>
            <button className="btn" onClick={handleReset}>
              リセット
            </button>
          </div>
        )}

        <p className="help">タップするたびに　空 → × → 家紋 → 空</p>

        {/* 試作品用：問題を行き来するボタン（後でタイトル画面・問題選択に置き換える） */}
        <nav className="dev-nav">
          <button className="btn btn-small" onClick={() => goTo(puzzleIndex - 1)} disabled={puzzleIndex === 0}>
            ◀ 前の問題
          </button>
          <button
            className="btn btn-small"
            onClick={() => goTo(puzzleIndex + 1)}
            disabled={puzzleIndex === PUZZLES.length - 1}
          >
            次の問題 ▶
          </button>
        </nav>
      </main>
    </div>
  );
}
