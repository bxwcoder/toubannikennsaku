// タイトル画面
import { Kamon } from '../components/Kamon';

interface Props {
  clearedCount: number;
  totalCount: number;
  onStart: () => void;
  onSelect: () => void;
  onHowTo: () => void;
  onSettings: () => void;
}

export function TitleScreen({ clearedCount, totalCount, onStart, onSelect, onHowTo, onSettings }: Props) {
  return (
    <div className="screen title-screen">
      <div className="title-emblem">
        <Kamon />
      </div>
      <h1 className="title-main">家紋陣取り</h1>
      <p className="title-catch">家紋を置いて、陣を取れ</p>

      <div className="menu">
        <button className="btn btn-primary btn-large" onClick={onStart}>
          {clearedCount === 0 ? 'ゲームスタート' : '続きから遊ぶ'}
        </button>
        <button className="btn btn-large" onClick={onSelect}>
          問題を選ぶ
        </button>
        <button className="btn btn-large" onClick={onHowTo}>
          遊び方
        </button>
        <button className="btn btn-large" onClick={onSettings}>
          設定
        </button>
      </div>
      <p className="title-progress">
        初級 {clearedCount} / {totalCount} 問クリア
      </p>
    </div>
  );
}
