// 「前回やったのはいつ？」の選択肢
// 正確な日付が分からなくても、だいたいで選べるようにする

export interface WhenOption {
  /** 画面に出す文字 */
  label: string;
  /** 今日から何日前か */
  daysAgo: number;
}

/** 初めて使うときの一覧用（短い文字） */
export const WHEN_SHORT: WhenOption[] = [
  { label: '今日', daysAgo: 0 },
  { label: '1週間前', daysAgo: 7 },
  { label: '1か月前', daysAgo: 30 },
  { label: 'わからない', daysAgo: 0 },
];

/** 項目を追加するとき用 */
export const WHEN_FULL: WhenOption[] = [
  { label: '今日', daysAgo: 0 },
  { label: '昨日', daysAgo: 1 },
  { label: '1週間くらい前', daysAgo: 7 },
  { label: '1か月くらい前', daysAgo: 30 },
  { label: 'おぼえていない（今日から数えます）', daysAgo: 0 },
];
