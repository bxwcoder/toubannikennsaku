// ① ホーム画面
import { useEffect, useRef, useState } from 'react';
import { type Item, type SortKey, type Status, SORT_LABELS } from '../types';
import { getItemInfo, sortItems } from '../lib/status';
import { navigate } from '../lib/router';
import { Header } from '../components/Header';
import { ItemRow } from '../components/ItemRow';
import { IconCalendar, IconClose, IconPlus, IconSettings } from '../components/Icons';

interface Props {
  items: Item[];
  today: string;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  onDoneToday: (id: string) => void;
  onLoadSample: () => void;
}

const HINT_KEY = 'last-done:hint-closed:v1';

function readHintClosed(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

const SUMMARY: { status: Status; label: string }[] = [
  { status: 'over', label: '目安を過ぎた' },
  { status: 'soon', label: 'もうすぐ' },
  { status: 'ok', label: '余裕あり' },
];

export function HomeScreen({ items, today, sortKey, onSortChange, onDoneToday, onLoadSample }: Props) {
  const [flashId, setFlashId] = useState<string | null>(null);
  const [hintClosed, setHintClosed] = useState(readHintClosed);

  // 並び順は、画面を開いたときと並べ替えを変えたときだけ決め直す。
  // 「やった」を押した直後に行が別の場所へ飛んでいかないようにするため
  const orderRef = useRef<{ key: SortKey; ids: string[] } | null>(null);
  if (!orderRef.current || orderRef.current.key !== sortKey) {
    orderRef.current = { key: sortKey, ids: sortItems(items, sortKey, today).map((it) => it.id) };
  }
  const byId = new Map(items.map((it) => [it.id, it]));
  const ordered = orderRef.current.ids.map((id) => byId.get(id)).filter((it): it is Item => !!it);
  for (const it of items) if (!orderRef.current.ids.includes(it.id)) ordered.push(it);

  useEffect(() => {
    if (!flashId) return;
    const timer = setTimeout(() => setFlashId(null), 1200);
    return () => clearTimeout(timer);
  }, [flashId]);

  const settingsButton = (
    <button type="button" className="header-icon-btn" onClick={() => navigate({ name: 'settings' })}>
      <IconSettings />
      <span>設定</span>
    </button>
  );

  if (items.length === 0) {
    return (
      <>
        <Header title="最後にやった日" right={settingsButton} />
        <main className="screen">
          <div className="empty">
            <div className="empty-icon">
              <IconCalendar width={40} height={40} />
            </div>
            <h2 className="empty-title">「前にいつやったっけ？」を記録しよう</h2>
            <ol className="empty-steps">
              <li>
                <span className="step-num">1</span>
                <span>排水口の掃除やシーツの交換など、忘れがちなことを登録</span>
              </li>
              <li>
                <span className="step-num">2</span>
                <span>やった日に「やった」ボタンを押すだけ</span>
              </li>
              <li>
                <span className="step-num">3</span>
                <span>何日たったか、そろそろやる時期かがひと目で分かる</span>
              </li>
            </ol>
            <button type="button" className="btn btn--primary btn--large btn--block" onClick={() => navigate({ name: 'new' })}>
              <IconPlus />
              <span>最初の項目を登録する</span>
            </button>
            <button type="button" className="btn btn--secondary btn--block" onClick={onLoadSample}>
              お試し用の見本を入れてみる
            </button>
            <p className="empty-note">見本はあとから1つずつ削除できます。</p>
          </div>
        </main>
      </>
    );
  }

  const counts = { over: 0, soon: 0, ok: 0, none: 0 } as Record<Status, number>;
  for (const it of items) counts[getItemInfo(it, today).status]++;

  return (
    <>
      <Header title="最後にやった日" right={settingsButton} />
      <main className="screen screen--with-fab">
        <div className="summary" aria-label="状態のまとめ">
          {SUMMARY.map(({ status, label }) => (
            <span key={status} className={`summary-chip summary-chip--${status}`}>
              {label}
              <strong>{counts[status]}</strong>
            </span>
          ))}
        </div>

        {!hintClosed ? (
          <div className="hint">
            <p>
              やったら右の<strong>「やった」</strong>を押すだけ。
              <br />
              項目の名前を押すと、くわしい情報や編集・削除ができます。
            </p>
            <button
              type="button"
              className="hint-close"
              aria-label="使い方の説明を閉じる"
              onClick={() => {
                setHintClosed(true);
                try {
                  localStorage.setItem(HINT_KEY, '1');
                } catch {
                  // 記憶できなくても困らない
                }
              }}
            >
              <IconClose />
            </button>
          </div>
        ) : null}

        <div className="toolbar">
          <label htmlFor="sort" className="sort-label">
            並べ替え
          </label>
          <select id="sort" className="sort-select" value={sortKey} onChange={(e) => onSortChange(e.target.value as SortKey)}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <ul className="row-list">
          {ordered.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              today={today}
              flash={flashId === item.id}
              onOpen={() => navigate({ name: 'detail', id: item.id })}
              onDoneToday={() => {
                setFlashId(item.id);
                onDoneToday(item.id);
              }}
            />
          ))}
        </ul>
      </main>

      <button type="button" className="fab" onClick={() => navigate({ name: 'new' })}>
        <IconPlus />
        <span>追加</span>
      </button>
    </>
  );
}
