// ホーム画面に並ぶ1つ分のカード
import type { Item } from '../types';
import { formatShort } from '../lib/date';
import { getItemInfo } from '../lib/status';
import { StatusBadge } from './StatusBadge';
import { IconCheck } from './Icons';

interface Props {
  item: Item;
  today: string;
  onOpen: () => void;
  onDoneToday: () => void;
}

export function ItemCard({ item, today, onOpen, onDoneToday }: Props) {
  const info = getItemInfo(item, today);
  const doneToday = item.lastDate === today;

  return (
    <li className={`card card--${info.status}`}>
      <button type="button" className="card-main" onClick={onOpen} aria-label={`${item.name}の詳細を開く`}>
        <div className="card-top">
          <span className="card-name">{item.name}</span>
          <StatusBadge status={info.status} label={info.statusLabel} />
        </div>
        <div className="card-elapsed">
          {info.elapsed === 0 ? (
            <span className="elapsed-num">今日</span>
          ) : (
            <>
              <span className="elapsed-num">{info.elapsed}</span>
              <span className="elapsed-unit">日前</span>
            </>
          )}
        </div>
        <div className="card-meta">
          <span>最後：{formatShort(item.lastDate, today)}</span>
          <span className="card-category">{item.category}</span>
        </div>
      </button>
      <div className="card-actions">
        <button
          type="button"
          className="btn btn--primary btn--done"
          onClick={onDoneToday}
          disabled={doneToday}
          aria-label={doneToday ? `${item.name}は今日記録済み` : `${item.name}を今日やった`}
        >
          <IconCheck />
          <span>{doneToday ? '今日記録済み' : '今日やった'}</span>
        </button>
      </div>
    </li>
  );
}
