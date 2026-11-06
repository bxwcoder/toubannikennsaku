// ③ 項目詳細画面
import { useState } from 'react';
import type { Item } from '../types';
import { elapsedLabel, formatLong, formatShort } from '../lib/date';
import { getItemInfo, type ItemInfo } from '../lib/status';
import { navigate } from '../lib/router';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconCheck, IconPencil } from '../components/Icons';

interface Props {
  item: Item;
  today: string;
  onBack: () => void;
  onDoneToday: () => void;
  onDelete: () => void;
}

/** 状態を文章で説明する */
function statusSentence(info: ItemInfo, today: string): string {
  if (info.remaining == null || !info.nextDate) return '目安は決めていません。何日たったかだけを記録しています。';
  const next = formatShort(info.nextDate, today);
  if (info.remaining < 0) return `目安の ${next} を${-info.remaining}日過ぎています。そろそろやりましょう。`;
  if (info.remaining === 0) return `今日（${next}）が目安の日です。`;
  return `次の目安は ${next}。あと${info.remaining}日です。`;
}

export function DetailScreen({ item, today, onBack, onDoneToday, onDelete }: Props) {
  const [confirm, setConfirm] = useState<'done' | 'delete' | null>(null);
  const info = getItemInfo(item, today);
  const doneToday = item.lastDate === today;

  return (
    <>
      <Header title="くわしく見る" onBack={onBack} />
      <main className="screen">
        <section className={`detail-card detail-card--${info.status}`}>
          <div className="detail-head">
            <h2 className="detail-name">{item.name}</h2>
            <span className="detail-category">{item.category}</span>
          </div>

          <div className="detail-main">
            <p className="detail-elapsed">
              {info.elapsed === 0 ? (
                <span className="elapsed-num">今日</span>
              ) : (
                <>
                  <span className="elapsed-num">{info.elapsed}</span>
                  <span className="elapsed-unit">日前</span>
                </>
              )}
            </p>
            <StatusBadge status={info.status} label={info.statusLabel} />
          </div>
          <p className="detail-sentence">{statusSentence(info, today)}</p>

          <dl className="detail-list">
            <div>
              <dt>最後にやった日</dt>
              <dd>{formatLong(item.lastDate)}</dd>
            </div>
            <div>
              <dt>経過日数</dt>
              <dd>{info.elapsed === 0 ? '今日やった' : `${info.elapsed}日`}</dd>
            </div>
            <div>
              <dt>次回の目安</dt>
              <dd>{item.intervalDays == null ? '設定なし' : `${item.intervalDays}日ごと`}</dd>
            </div>
            <div>
              <dt>次回の目安日</dt>
              <dd>{info.nextDate ? formatLong(info.nextDate) : '—'}</dd>
            </div>
          </dl>
        </section>

        <button
          type="button"
          className="btn btn--primary btn--huge btn--block"
          onClick={() => setConfirm('done')}
          disabled={doneToday}
        >
          <IconCheck width={28} height={28} strokeWidth={3} />
          <span>{doneToday ? '今日はもう記録しました' : '今日やった'}</span>
        </button>

        <div className="detail-sub-actions">
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => navigate({ name: 'edit', id: item.id })}
          >
            <IconPencil />
            <span>編集</span>
          </button>
          <button type="button" className="btn btn--danger-outline btn--block" onClick={() => setConfirm('delete')}>
            削除
          </button>
        </div>
      </main>

      {confirm === 'done' ? (
        <ConfirmDialog
          title="今日やったことにしますか？"
          message={`「${item.name}」の最後にやった日を、今日（${formatLong(today)}）に変えます。前回は${formatLong(item.lastDate)}（${elapsedLabel(info.elapsed)}）でした。`}
          confirmLabel="記録する"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            onDoneToday();
          }}
        />
      ) : null}

      {confirm === 'delete' ? (
        <ConfirmDialog
          title="この項目を削除しますか？"
          message={`「${item.name}」を削除します。削除すると元に戻せません。`}
          confirmLabel="削除する"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            onDelete();
          }}
        />
      ) : null}
    </>
  );
}
