// ③ 項目詳細画面
import { useState } from 'react';
import type { Item } from '../types';
import { elapsedLabel, formatLong } from '../lib/date';
import { getItemInfo } from '../lib/status';
import { navigate } from '../lib/router';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconCheck } from '../components/Icons';

interface Props {
  item: Item;
  today: string;
  onBack: () => void;
  onDoneToday: () => void;
  onDelete: () => void;
}

export function DetailScreen({ item, today, onBack, onDoneToday, onDelete }: Props) {
  const [confirm, setConfirm] = useState<'done' | 'delete' | null>(null);
  const info = getItemInfo(item, today);
  const doneToday = item.lastDate === today;

  return (
    <>
      <Header title="項目の詳細" onBack={onBack} />
      <main className="screen">
        <section className={`detail-card card--${info.status}`}>
          <div className="detail-head">
            <h2 className="detail-name">{item.name}</h2>
            <span className="detail-category">{item.category}</span>
          </div>
          <StatusBadge status={info.status} label={info.statusLabel} />
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

        <div className="detail-actions">
          <button
            type="button"
            className="btn btn--primary btn--large btn--block"
            onClick={() => setConfirm('done')}
            disabled={doneToday}
          >
            <IconCheck />
            <span>{doneToday ? '今日記録済み' : '今日やった'}</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--large btn--block"
            onClick={() => navigate({ name: 'edit', id: item.id })}
          >
            項目を編集
          </button>
          <button
            type="button"
            className="btn btn--danger-outline btn--large btn--block"
            onClick={() => setConfirm('delete')}
          >
            項目を削除
          </button>
        </div>
      </main>

      {confirm === 'done' ? (
        <ConfirmDialog
          title="今日やったことにしますか？"
          message={`「${item.name}」の最後にやった日を、今日（${formatLong(today)}）に更新します。前回は${formatLong(item.lastDate)}（${elapsedLabel(info.elapsed)}）です。`}
          confirmLabel="更新する"
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
