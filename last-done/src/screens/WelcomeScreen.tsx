// はじめて開いたときの画面（項目がひとつもないとき）
// 1. 当てはまるものをタップで選ぶ → 2. それぞれ前回いつやったかを選ぶ → 完了
// 文字を入力しなくても始められるようにしている
import { useState } from 'react';
import { TEMPLATES } from '../lib/templates';
import { WHEN_SHORT } from '../lib/when';
import { addDays } from '../lib/date';
import { navigate } from '../lib/router';
import type { ItemFormValues } from './ItemFormScreen';
import { Header } from '../components/Header';
import { IconCheck } from '../components/Icons';

interface Props {
  today: string;
  onComplete: (values: ItemFormValues[]) => void;
  onLoadSample: () => void;
}

function intervalLabel(days: number): string {
  if (days % 365 === 0) return `${days / 365}年ごと`;
  if (days % 30 === 0) return `${days / 30}か月ごと`;
  if (days % 7 === 0) return `${days / 7}週間ごと`;
  return `${days}日ごと`;
}

export function WelcomeScreen({ today, onComplete, onLoadSample }: Props) {
  const [step, setStep] = useState<'pick' | 'when'>('pick');
  const [selected, setSelected] = useState<string[]>([]);
  /** 項目名 → WHEN_SHORT の何番目を選んだか */
  const [when, setWhen] = useState<Record<string, number>>({});

  const toggle = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const finish = () => {
    const values: ItemFormValues[] = selected.map((name) => {
      const t = TEMPLATES.find((x) => x.name === name)!;
      const option = WHEN_SHORT[when[name] ?? WHEN_SHORT.length - 1];
      return {
        name: t.name,
        category: t.category,
        lastDate: addDays(today, -option.daysAgo),
        intervalDays: t.intervalDays,
      };
    });
    onComplete(values);
  };

  // ---------- 2. 前回はいつ？ ----------
  if (step === 'when') {
    return (
      <>
        <Header title="あと少しです" onBack={() => setStep('pick')} />
        <main className="screen screen--with-bottom">
          <h2 className="page-question">前回やったのはいつですか？</h2>
          <p className="page-lead">だいたいで大丈夫です。わからないものは、今日から数えはじめます。</p>

          <ul className="when-list">
            {selected.map((name) => {
              const current = when[name] ?? WHEN_SHORT.length - 1;
              return (
                <li key={name} className="when-item">
                  <span className="when-name">{name}</span>
                  <div className="choices choices--tight" role="radiogroup" aria-label={`${name}を前回やったのはいつ`}>
                    {WHEN_SHORT.map((o, i) => (
                      <button
                        key={o.label}
                        type="button"
                        className="choice choice--compact"
                        role="radio"
                        aria-checked={current === i}
                        onClick={() => setWhen((prev) => ({ ...prev, [name]: i }))}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </main>
        <div className="bottom-bar">
          <button type="button" className="btn btn--primary btn--large btn--block" onClick={finish}>
            はじめる
          </button>
        </div>
      </>
    );
  }

  // ---------- 1. 当てはまるものを選ぶ ----------
  return (
    <>
      <Header title="最後にやった日" />
      <main className="screen screen--with-bottom">
        <h2 className="welcome-title">「前にいつやったっけ？」をなくそう</h2>
        <p className="page-lead">
          記録したいものを<strong>タップして選んでください</strong>。いくつでも選べます。あとから追加・削除もできます。
        </p>

        <ul className="tiles">
          {TEMPLATES.map((t) => {
            const on = selected.includes(t.name);
            return (
              <li key={t.name}>
                <button type="button" className="tile" aria-pressed={on} onClick={() => toggle(t.name)}>
                  <span className="tile-check" aria-hidden="true">
                    {on ? <IconCheck width={18} height={18} strokeWidth={3} /> : null}
                  </span>
                  <span className="tile-name">{t.name}</span>
                  <span className="tile-sub">{intervalLabel(t.intervalDays)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="welcome-links">
          <button type="button" className="link-btn" onClick={() => navigate({ name: 'new' })}>
            一覧にないものを自分で入力する
          </button>
          <button type="button" className="link-btn" onClick={onLoadSample}>
            まず見本で試してみる
          </button>
          <button type="button" className="link-btn" onClick={() => navigate({ name: 'settings' })}>
            バックアップから元に戻す
          </button>
        </div>
      </main>
      <div className="bottom-bar">
        <button
          type="button"
          className="btn btn--primary btn--large btn--block"
          disabled={selected.length === 0}
          onClick={() => {
            setStep('when');
            window.scrollTo(0, 0);
          }}
        >
          {selected.length === 0 ? '上から選んでください' : `次へ（${selected.length}件）`}
        </button>
      </div>
    </>
  );
}
