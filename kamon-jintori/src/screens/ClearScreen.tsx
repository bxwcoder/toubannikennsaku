// クリア画面（ゲーム画面の上に重ねて表示）
import { Kamon } from '../components/Kamon';
import { formatTime } from '../services/storage';

interface Props {
  puzzleId: number;
  time: number;
  hintsUsed: number;
  isNewBest: boolean;
  previousBest: number | null;
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onList: () => void;
}

export function ClearScreen({ puzzleId, time, hintsUsed, isNewBest, previousBest, hasNext, onNext, onRetry, onList }: Props) {
  return (
    <div className="overlay" role="dialog" aria-label="クリア">
      <div className="clear-card">
        <div className="clear-stamp">
          <Kamon color="#b03a2e" />
        </div>
        <h2 className="clear-title">見事！</h2>
        <p className="clear-sub">第{puzzleId}問　陣取り完了</p>

        <dl className="clear-stats">
          <div>
            <dt>クリアタイム</dt>
            <dd>
              {formatTime(time)}
              {isNewBest && previousBest !== null && <span className="new-best">新記録！</span>}
            </dd>
          </div>
          {previousBest !== null && !isNewBest && (
            <div>
              <dt>ベストタイム</dt>
              <dd>{formatTime(previousBest)}</dd>
            </div>
          )}
          <div>
            <dt>使ったヒント</dt>
            <dd>{hintsUsed === 0 ? 'なし（自力でクリア）' : `${hintsUsed}回`}</dd>
          </div>
        </dl>

        <div className="clear-buttons">
          {hasNext ? (
            <button className="btn btn-primary btn-large" onClick={onNext}>
              次の問題へ
            </button>
          ) : (
            <p className="all-clear">初級の全問題をクリアしました！</p>
          )}
          <button className="btn btn-large" onClick={onRetry}>
            もう一度遊ぶ
          </button>
          <button className="btn btn-small btn-ghost" onClick={onList}>
            問題一覧へ
          </button>
        </div>
      </div>
    </div>
  );
}
