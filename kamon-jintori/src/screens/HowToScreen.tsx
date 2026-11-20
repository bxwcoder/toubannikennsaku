// 遊び方の画面
import { Board } from '../components/Board';
import type { CellState, Puzzle } from '../game/types';

// 説明用の小さな4×4の例（正解が1通りの盤面）
const EXAMPLE: Puzzle = {
  id: 0,
  size: 4,
  regions: [0, 0, 1, 1, 2, 0, 1, 1, 2, 2, 3, 1, 2, 3, 3, 3],
  solution: [1, 3, 0, 2],
  technique: 1,
};
const EXAMPLE_CELLS: CellState[] = EXAMPLE.regions.map((_, i) =>
  EXAMPLE.solution[Math.floor(i / 4)] === i % 4 ? 'kamon' : 'empty',
);

export function HowToScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen">
      <header className="bar">
        <button className="btn btn-small btn-ghost" onClick={onBack}>
          ‹ 戻る
        </button>
        <h2 className="bar-title">遊び方</h2>
        <span className="bar-side" />
      </header>

      <div className="howto">
        <p className="howto-lead">盤面に家紋を置いていくパズルです。次のルールをすべて守って置けたらクリア！</p>
        <ol className="rules">
          <li>
            <b>横の列</b>には家紋を<b>1つだけ</b>
          </li>
          <li>
            <b>縦の列</b>には家紋を<b>1つだけ</b>
          </li>
          <li>
            <b>同じ色のエリア</b>には家紋を<b>1つだけ</b>
          </li>
          <li>
            家紋同士は<b>斜めにも隣り合わない</b>
          </li>
        </ol>

        <div className="howto-example">
          <div className="howto-board">
            <Board puzzle={EXAMPLE} cells={EXAMPLE_CELLS} violations={new Set()} cleared={false} onTap={() => {}} />
          </div>
          <p className="howto-caption">完成の例：どの列・どのエリアにも家紋が1つずつ</p>
        </div>

        <h3 className="howto-h">操作</h3>
        <ul className="howto-list">
          <li>マスをタップするたびに「空 → × → 家紋 → 空」と変わります</li>
          <li>×は「ここには置かない」という自分用のメモです</li>
          <li>ルール違反の家紋は赤くなります</li>
          <li>「1手戻す」で何回でも戻せます</li>
        </ul>

        <h3 className="howto-h">解き方のコツ</h3>
        <ul className="howto-list">
          <li>置ける場所が1か所しかない列やエリアを探そう</li>
          <li>家紋を置いたら、同じ列・エリアと周りのマスに×を付けよう</li>
          <li>困ったら「ヒント」で次に決められるマスと理由が分かります</li>
        </ul>
        <p className="howto-note">どの問題も、当てずっぽうなしで推理だけで解けます。</p>
      </div>
    </div>
  );
}
