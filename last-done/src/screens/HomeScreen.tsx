// ① ホーム画面
import { useMemo } from 'react';
import { type Item, type SortKey, SORT_LABELS } from '../types';
import { sortItems } from '../lib/status';
import { navigate } from '../lib/router';
import { Header } from '../components/Header';
import { ItemCard } from '../components/ItemCard';
import { IconCalendar, IconPlus } from '../components/Icons';

interface Props {
  items: Item[];
  today: string;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  onDoneToday: (id: string) => void;
  onLoadSample: () => void;
}

export function HomeScreen({ items, today, sortKey, onSortChange, onDoneToday, onLoadSample }: Props) {
  const sorted = useMemo(() => sortItems(items, sortKey, today), [items, sortKey, today]);

  if (items.length === 0) {
    return (
      <>
        <Header title="最後にやった日" />
        <main className="screen">
          <div className="empty">
            <div className="empty-icon">
              <IconCalendar width={40} height={40} />
            </div>
            <h2 className="empty-title">まだ項目がありません</h2>
            <p className="empty-text">
              排水口の掃除やシーツの交換など、
              <br />
              「前にいつやったっけ？」となることを登録しましょう。
              <br />
              よく使う項目から選ぶこともできます。
            </p>
            <button type="button" className="btn btn--primary btn--large" onClick={() => navigate({ name: 'new' })}>
              <IconPlus />
              <span>最初の項目を登録する</span>
            </button>
            <button type="button" className="btn btn--secondary empty-sample" onClick={onLoadSample}>
              お試し用の見本を入れてみる
            </button>
            <p className="empty-note">見本はあとから1つずつ削除できます。</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="最後にやった日" />
      <main className="screen screen--with-add">
        <div className="toolbar">
          <label className="sort">
            <span className="sort-label">並べ替え</span>
            <select
              className="sort-select"
              value={sortKey}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <span className="count">{items.length}件</span>
        </div>

        <ul className="card-list">
          {sorted.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              today={today}
              onOpen={() => navigate({ name: 'detail', id: item.id })}
              onDoneToday={() => onDoneToday(item.id)}
            />
          ))}
        </ul>
      </main>

      <div className="add-bar">
        <button type="button" className="btn btn--primary btn--large btn--block" onClick={() => navigate({ name: 'new' })}>
          <IconPlus />
          <span>項目を追加</span>
        </button>
      </div>
    </>
  );
}
