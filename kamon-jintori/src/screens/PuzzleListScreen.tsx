// 問題一覧（どの問題からでも遊べる）
import type { Puzzle } from '../game/types';
import { formatTime, type PuzzleResult } from '../services/storage';

interface Props {
  puzzles: Puzzle[];
  results: Record<string, PuzzleResult>;
  onPick: (index: number) => void;
  onBack: () => void;
}

const STAR_LABEL: Record<number, string> = { 1: '★ はじめの一歩', 2: '★★ 少し考える', 3: '★★★ じっくり推理' };

export function PuzzleListScreen({ puzzles, results, onPick, onBack }: Props) {
  const cleared = puzzles.filter((p) => results[p.key!]).length;
  return (
    <div className="screen">
      <header className="bar">
        <button className="btn btn-small btn-ghost" onClick={onBack} aria-label="タイトルへ戻る">
          ‹ 戻る
        </button>
        <h2 className="bar-title">問題を選ぶ</h2>
        <span className="bar-side" />
      </header>

      <div className="level-tabs">
        <span className="level-tab level-tab-on">初級 6×6</span>
        <span className="level-tab level-tab-off">中級 8×8（準備中）</span>
        <span className="level-tab level-tab-off">上級 10×10（準備中）</span>
      </div>
      <p className="list-progress">
        {cleared} / {puzzles.length} 問クリア
      </p>

      {[1, 2, 3].map((star) => {
        const group = puzzles.map((p, i) => ({ p, i })).filter(({ p }) => p.technique === star);
        if (group.length === 0) return null;
        return (
          <section key={star} className="list-group">
            <h3 className="list-heading">{STAR_LABEL[star]}</h3>
            <div className="list-grid">
              {group.map(({ p, i }) => {
                const r = results[p.key!];
                return (
                  <button key={p.id} className={`tile ${r ? 'tile-done' : ''}`} onClick={() => onPick(i)}>
                    <span className="tile-num">{p.id}</span>
                    <span className="tile-sub">{r ? formatTime(r.bestTime) : '　'}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
