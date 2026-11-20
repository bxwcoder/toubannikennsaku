// 広告の窓口
// 今は広告を出さず、すぐに「OK」を返すだけ。
// 将来、広告（例: Google AdMob）を入れるときは、このファイルの中身だけを書き換えればよい。
// ゲーム画面側はこの窓口を呼ぶだけなので、他のファイルを変える必要はない。

/** インタースティシャル広告（全画面広告）を何問クリアごとに出すか */
export const INTERSTITIAL_EVERY = 3;

export const ads = {
  /**
   * ヒントを見る前に呼ぶ。
   * 将来: リワード広告（動画を最後まで見るとごほうび）を表示し、見終わったら true を返す。
   * 今: 広告なしで、すぐ true を返す。
   */
  async requestHint(): Promise<boolean> {
    return true;
  },

  /**
   * クリア後に「次の問題へ」を押したときに呼ぶ。
   * 将来: totalClears が INTERSTITIAL_EVERY の倍数なら全画面広告を表示する。
   * 今: 何もしない。
   */
  async beforeNextPuzzle(totalClears: number): Promise<void> {
    if (totalClears > 0 && totalClears % INTERSTITIAL_EVERY === 0) {
      // ここに全画面広告を表示する処理を入れる
    }
  },
};
