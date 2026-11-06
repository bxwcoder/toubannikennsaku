// ホーム画面に並ぶ1行分
// 左側（名前など）を押すと詳細へ、右の「やった」ボタンを押すと今日の日付で記録する
import type { Item } from '../types';
import { formatShort } from '../lib/date';
import { getItemInfo } from '../lib/status';
import { StatusBadge } from './StatusBadge';
import { IconCheck } from './Icons';

interface Props {
  item: Item;
  today: string;
  flash: boolean;
  onOpen: () => void;
  onDoneToday: () => void;
}

export function ItemRow({ item, today, flash, onOpen, onDoneToday }: Props) {
  const info = getItemInfo(item, today);
  const doneToday = item.lastDate === today;

  return (
    <li className={`row row--${info.status}${flash ? ' row--flash' : ''}`}>
      <button type="button" className="row-main" onClick={onOpen}>
        <span className="row-text">
          <span className="row-name">{item.name}</span>
          <span className="row-sub">
            <StatusBadge status={info.status} label={info.statusLabel} />
            <span className="row-date">最後 {formatShort(item.lastDate, today)}</span>
          </span>
        </span>
        <span className="row-elapsed" aria-label={info.elapsed === 0 ? '今日やった' : `${info.elapsed}日前`}>
          {info.elapsed === 0 ? (
            <span className="row-elapsed-today">今日</span>
          ) : (
            <>
              <span className="row-elapsed-num">{info.elapsed}</span>
              <span className="row-elapsed-unit">日前</span>
            </>
          )}
        </span>
      </button>
      <button
        type="button"
        className={doneToday ? 'row-done row-done--done' : 'row-done'}
        onClick={onDoneToday}
        disabled={doneToday}
        aria-label={doneToday ? `${item.name}は今日記録済み` : `${item.name}を今日やった`}
      >
        <IconCheck width={26} height={26} strokeWidth={3} />
        <span>{doneToday ? '記録済み' : 'やった'}</span>
      </button>
    </li>
  );
}
