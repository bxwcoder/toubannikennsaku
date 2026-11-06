// 経過日数・目安の状態・並べ替えを計算するファイル
import type { Item, SortKey, Status } from '../types';
import { addDays, daysBetween } from './date';

/** 「目安が近い」とみなす残り日数（残り3日以内で注意表示） */
export const SOON_DAYS = 3;

export interface ItemInfo {
  /** 最後にやった日から今日までの日数 */
  elapsed: number;
  /** 目安までの残り日数（目安なしは null。0 は今日が目安日、マイナスは超過） */
  remaining: number | null;
  /** 次回の目安日（目安なしは null） */
  nextDate: string | null;
  status: Status;
  /** 状態を文字で表したもの（色が分からなくても読めるように） */
  statusLabel: string;
}

export function getItemInfo(item: Item, today: string): ItemInfo {
  const elapsed = Math.max(0, daysBetween(item.lastDate, today));

  if (item.intervalDays == null) {
    return { elapsed, remaining: null, nextDate: null, status: 'none', statusLabel: '目安なし' };
  }

  const remaining = item.intervalDays - elapsed;
  const nextDate = addDays(item.lastDate, item.intervalDays);

  // 目安日数ちょうど経過した時点で「目安を過ぎた」扱いにする
  if (remaining < 0) {
    return { elapsed, remaining, nextDate, status: 'over', statusLabel: `${-remaining}日超過` };
  }
  if (remaining === 0) {
    return { elapsed, remaining, nextDate, status: 'over', statusLabel: '今日が目安日' };
  }
  if (remaining <= SOON_DAYS) {
    return { elapsed, remaining, nextDate, status: 'soon', statusLabel: `もうすぐ（あと${remaining}日）` };
  }
  return { elapsed, remaining, nextDate, status: 'ok', statusLabel: `あと${remaining}日` };
}

export function sortItems(items: Item[], key: SortKey, today: string): Item[] {
  const withInfo = items.map((item) => ({ item, info: getItemInfo(item, today) }));
  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, 'ja');

  withInfo.sort((a, b) => {
    switch (key) {
      case 'elapsedDesc':
        return b.info.elapsed - a.info.elapsed || byName(a.item, b.item);
      case 'elapsedAsc':
        return a.info.elapsed - b.info.elapsed || byName(a.item, b.item);
      case 'name':
        return byName(a.item, b.item);
      case 'dueSoon': {
        // 目安のある項目を残り日数の少ない順に。目安なしの項目は最後
        const ra = a.info.remaining;
        const rb = b.info.remaining;
        if (ra == null && rb == null) return b.info.elapsed - a.info.elapsed || byName(a.item, b.item);
        if (ra == null) return 1;
        if (rb == null) return -1;
        return ra - rb || byName(a.item, b.item);
      }
    }
  });

  return withInfo.map((x) => x.item);
}
