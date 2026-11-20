// ゲーム画面
import { useEffect, useMemo, useRef, useState } from 'react';
import { Board } from '../components/Board';
import { getHint, type Hint } from '../game/hint';
import { findViolations, isCleared, nextState } from '../game/rules';
import type { CellState, Puzzle } from '../game/types';
import { ads } from '../services/ads';
import { clearProgress, formatTime, loadProgress, saveProgress } from '../services/storage';
import { sound } from '../services/sound';

interface Props {
  puzzle: Puzzle;
  showTimer: boolean;
  /** クリアしたときに呼ばれる（時間とヒント数を渡す） */
  onCleared: (time: number, hintsUsed: number) => void;
  onBack: () => void;
}

const emptyCells = (size: number): CellState[] => new Array(size * size).fill('empty');

export function GameScreen({ puzzle, showTimer, onCleared, onBack }: Props) {
  const key = puzzle.key ?? String(puzzle.id);
  // 遊びかけのデータがあれば、そこから再開する
  const saved = useMemo(() => {
    const p = loadProgress();
    return p && p.key === key && p.cells.length === puzzle.size * puzzle.size ? p : null;
  }, [key, puzzle.size]);

  const [cells, setCells] = useState<CellState[]>(() => saved?.cells ?? emptyCells(puzzle.size));
  const [history, setHistory] = useState<CellState[][]>([]);
  const [elapsed, setElapsed] = useState(saved?.elapsed ?? 0);
  const [hintsUsed, setHintsUsed] = useState(saved?.hintsUsed ?? 0);
  const [hint, setHint] = useState<Hint | null>(null);

  const violations = useMemo(() => findViolations(cells, puzzle), [cells, puzzle]);
  const cleared = useMemo(() => isCleared(cells, puzzle), [cells, puzzle]);
  const kamonCount = cells.filter((s) => s === 'kamon').length;

  // 時間を数える（クリアしたら止まる。アプリが裏に回っている間も止まる）
  useEffect(() => {
    if (cleared) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cleared]);

  // 遊びかけの状態を保存（アプリを閉じても続きから遊べる）
  const latest = useRef({ cells, elapsed, hintsUsed });
  latest.current = { cells, elapsed, hintsUsed };
  useEffect(() => {
    if (!cleared) saveProgress({ key, cells, elapsed, hintsUsed });
  }, [cells, hintsUsed, cleared, key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const save = () => {
      if (document.visibilityState === 'hidden' && !isCleared(latest.current.cells, puzzle)) {
        saveProgress({ key, ...latest.current });
      }
    };
    document.addEventListener('visibilitychange', save);
    return () => {
      document.removeEventListener('visibilitychange', save);
      if (!isCleared(latest.current.cells, puzzle)) saveProgress({ key, ...latest.current });
    };
  }, [key, puzzle]);

  // クリアしたとき: 効果音 → 盤面が光る演出 → 少し待ってクリア画面へ
  const reported = useRef(false);
  useEffect(() => {
    if (!cleared || reported.current) return;
    reported.current = true;
    clearProgress();
    sound.clear();
    const t = setTimeout(() => onCleared(elapsed, hintsUsed), 1100);
    return () => clearTimeout(t);
  }, [cleared]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = (i: number) => {
    if (cleared) return;
    const next = cells.map((s, j) => (j === i ? nextState(s) : s));
    setHistory((h) => [...h, cells]);
    setCells(next);
    setHint(null);
    if (next[i] === 'kamon') {
      // 置いた家紋が違反になったら警告音
      if (findViolations(next, puzzle).has(i)) sound.error();
      else sound.place();
    } else {
      sound.tap();
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setCells(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setHint(null);
    sound.tap();
  };

  const handleReset = () => {
    if (!cells.some((s) => s !== 'empty')) return;
    setHistory((h) => [...h, cells]); // リセットも「1手戻す」で取り消せる
    setCells(emptyCells(puzzle.size));
    setHint(null);
    sound.tap();
  };

  const handleHint = async () => {
    if (cleared) return;
    const ok = await ads.requestHint(); // 将来ここでリワード広告を表示する
    if (!ok) return;
    setHint(getHint(puzzle, cells));
    setHintsUsed((n) => n + 1);
    sound.hint();
  };

  let status: string;
  if (cleared) status = '見事、陣取り完了！';
  else if (violations.size) status = '赤い家紋がルールに違反しています';
  else status = `家紋 ${kamonCount} / ${puzzle.size}`;

  return (
    <div className="screen game-screen">
      <header className="bar">
        <button className="btn btn-small btn-ghost" onClick={onBack} aria-label="問題一覧へ戻る">
          ‹ 一覧
        </button>
        <h2 className="bar-title">
          第{puzzle.id}問 <span className="level">{'★'.repeat(puzzle.technique)}</span>
        </h2>
        <span className="bar-side timer">{showTimer ? formatTime(elapsed) : ''}</span>
      </header>

      <p className={`status ${violations.size && !cleared ? 'status-bad' : ''}`}>{status}</p>

      <Board
        puzzle={puzzle}
        cells={cells}
        violations={violations}
        cleared={cleared}
        onTap={handleTap}
        hintCells={hint?.cells}
        hintKind={hint?.kind}
      />

      <div className={`hint-box ${hint ? 'hint-box-on' : ''} ${hint?.kind === 'wrong' ? 'hint-box-wrong' : ''}`} aria-live="polite">
        {hint ? hint.message : 'タップするたびに　空 → × → 家紋'}
      </div>

      {/* 片手で押しやすいよう、操作ボタンは画面の下にまとめる */}
      <div className="game-controls">
        <button className="btn ctrl" onClick={handleUndo} disabled={history.length === 0 || cleared}>
          <span className="ctrl-icon">↶</span>1手戻す
        </button>
        <button className="btn ctrl ctrl-hint" onClick={handleHint} disabled={cleared}>
          <span className="ctrl-icon">💡</span>ヒント
        </button>
        <button className="btn ctrl" onClick={handleReset} disabled={cleared}>
          <span className="ctrl-icon">⟲</span>リセット
        </button>
      </div>
    </div>
  );
}
