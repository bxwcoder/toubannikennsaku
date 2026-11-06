// ② 項目登録画面（編集画面としても使う）
// 新しく登録するとき: 「何を記録するか選ぶ」→「内容を確かめて登録」の2段階
// 編集するとき: いきなり内容の画面
import { useState, type FormEvent } from 'react';
import { CATEGORIES, type Category, type Item } from '../types';
import { TEMPLATES, type Template } from '../lib/templates';
import { addDays, formatLong, isValidDateString } from '../lib/date';
import { WHEN_FULL } from '../lib/when';
import { Header } from '../components/Header';
import { Sheet } from '../components/Sheet';
import { IconChevron, IconPencil } from '../components/Icons';

export interface ItemFormValues {
  name: string;
  category: Category;
  lastDate: string;
  intervalDays: number | null;
}

interface Props {
  /** 編集のときは元の項目。新しく登録するときは undefined */
  initial?: Item;
  today: string;
  onSubmit: (values: ItemFormValues) => void;
  onBack: () => void;
  /** すでに登録してある項目名（一覧に「登録済み」と出すため） */
  existingNames?: string[];
}

const NAME_MAX = 40;
const INTERVAL_MAX = 3650;

/** 目安の選択肢（null は「なし」） */
const INTERVAL_CHOICES: { label: string; days: number | null }[] = [
  { label: 'なし', days: null },
  { label: '1週間', days: 7 },
  { label: '2週間', days: 14 },
  { label: '1か月', days: 30 },
  { label: '3か月', days: 90 },
  { label: '半年', days: 180 },
  { label: '1年', days: 365 },
];

function intervalText(days: number): string {
  const preset = INTERVAL_CHOICES.find((c) => c.days === days);
  return preset ? `${preset.label}（${days}日）` : `${days}日`;
}

interface Errors {
  name?: string;
  lastDate?: string;
  interval?: string;
}

export function ItemFormScreen({ initial, today, onSubmit, onBack, existingNames = [] }: Props) {
  const isEdit = !!initial;
  const yesterday = addDays(today, -1);

  const [step, setStep] = useState<'choose' | 'form'>(isEdit ? 'form' : 'choose');
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'その他');
  const [lastDate, setLastDate] = useState(initial?.lastDate ?? today);
  const [pickDate, setPickDate] = useState(!!initial && initial.lastDate !== today && initial.lastDate !== yesterday);
  const [intervalDays, setIntervalDays] = useState<number | null>(initial ? initial.intervalDays : 30);
  const [customInterval, setCustomInterval] = useState(
    initial?.intervalDays != null && !INTERVAL_CHOICES.some((c) => c.days === initial.intervalDays)
      ? String(initial.intervalDays)
      : '',
  );
  const [useCustom, setUseCustom] = useState(customInterval !== '');
  const [errors, setErrors] = useState<Errors>({});
  /** テンプレートを押したときに出す「前回はいつ？」の小窓 */
  const [quick, setQuick] = useState<Template | null>(null);

  const startWith = (t: Template | null) => {
    if (t) {
      setName(t.name);
      setCategory(t.category);
      setIntervalDays(t.intervalDays);
    } else {
      setName('');
      setCategory('その他');
      setIntervalDays(30);
    }
    setUseCustom(false);
    setCustomInterval('');
    setLastDate(today);
    setPickDate(false);
    setErrors({});
    setStep('form');
    window.scrollTo(0, 0);
    if (!t) setTimeout(() => document.getElementById('f-name')?.focus(), 50);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = '項目名を入力してください';
    if (!isValidDateString(lastDate)) e.lastDate = '日付を選んでください';
    else if (lastDate > today) e.lastDate = '未来の日付は選べません';
    if (useCustom) {
      const n = Number(customInterval);
      if (!customInterval.trim() || !Number.isInteger(n) || n < 1 || n > INTERVAL_MAX) {
        e.interval = `1〜${INTERVAL_MAX}の数字を入力してください`;
      }
    }
    return e;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstId = e.name ? 'f-name' : e.lastDate ? 'f-date' : 'f-interval';
      document.getElementById(firstId)?.focus();
      return;
    }
    onSubmit({
      name: name.trim(),
      category,
      lastDate,
      intervalDays: useCustom ? Number(customInterval) : intervalDays,
    });
  };

  // ---------- 1段階目: 何を記録するか選ぶ ----------
  if (step === 'choose') {
    return (
      <>
        <Header title="項目を追加" onBack={onBack} />
        <main className="screen">
          <h2 className="page-question">何を記録しますか？</h2>

          <button type="button" className="choose-own" onClick={() => startWith(null)}>
            <IconPencil />
            <span className="choose-own-text">
              <span className="choose-own-label">自分で名前を入力する</span>
              <span className="choose-own-help">下の一覧にないものはこちら</span>
            </span>
            <IconChevron className="choose-chevron" />
          </button>

          <h3 className="list-heading">よく使う項目（タップするだけで追加できます）</h3>
          {CATEGORIES.filter((c) => TEMPLATES.some((t) => t.category === c)).map((c) => (
            <section key={c} className="tpl-group">
              <h4 className="tpl-group-title">{c}</h4>
              <ul className="tpl-list">
                {TEMPLATES.filter((t) => t.category === c).map((t) => (
                  <li key={t.name}>
                    <button type="button" className="tpl-item" onClick={() => setQuick(t)}>
                      <span className="tpl-name">
                        {t.name}
                        {existingNames.includes(t.name) ? <span className="tpl-registered">登録済み</span> : null}
                      </span>
                      <span className="tpl-interval">{intervalText(t.intervalDays)}</span>
                      <IconChevron className="choose-chevron" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </main>

        {quick ? (
          <Sheet title={`「${quick.name}」を前回やったのはいつ？`} onClose={() => setQuick(null)}>
            <div className="sheet-options">
              {WHEN_FULL.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  className="sheet-option"
                  onClick={() =>
                    onSubmit({
                      name: quick.name,
                      category: quick.category,
                      lastDate: addDays(today, -o.daysAgo),
                      intervalDays: quick.intervalDays,
                    })
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="link-btn sheet-more"
              onClick={() => {
                const t = quick;
                setQuick(null);
                startWith(t);
              }}
            >
              日付や間隔を自分で決める
            </button>
          </Sheet>
        ) : null}
      </>
    );
  }

  // ---------- 2段階目: 内容を確かめて登録 ----------
  const dateChoice = pickDate ? 'pick' : lastDate === today ? 'today' : lastDate === yesterday ? 'yesterday' : 'pick';

  return (
    <>
      <Header title={isEdit ? '項目を編集' : '内容を確かめて登録'} onBack={isEdit ? onBack : () => setStep('choose')} />
      <main className="screen screen--form">
        <form onSubmit={handleSubmit} noValidate className="form">
          <div className="field">
            <label htmlFor="f-name" className="field-label">
              項目名
            </label>
            <input
              id="f-name"
              className="input"
              type="text"
              value={name}
              maxLength={NAME_MAX}
              placeholder="例：排水口の掃除"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'f-name-error' : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
            />
            {errors.name ? (
              <p id="f-name-error" className="field-error">
                {errors.name}
              </p>
            ) : null}
          </div>

          <fieldset className="field">
            <legend className="field-label">前回やったのはいつ？</legend>
            <div className="choices" role="radiogroup" aria-label="前回やった日">
              <button
                type="button"
                className="choice"
                role="radio"
                aria-checked={dateChoice === 'today'}
                onClick={() => {
                  setLastDate(today);
                  setPickDate(false);
                }}
              >
                今日
              </button>
              <button
                type="button"
                className="choice"
                role="radio"
                aria-checked={dateChoice === 'yesterday'}
                onClick={() => {
                  setLastDate(yesterday);
                  setPickDate(false);
                }}
              >
                昨日
              </button>
              <button
                type="button"
                className="choice"
                role="radio"
                aria-checked={dateChoice === 'pick'}
                onClick={() => {
                  setPickDate(true);
                  setTimeout(() => document.getElementById('f-date')?.focus(), 50);
                }}
              >
                日付を選ぶ
              </button>
            </div>
            {dateChoice === 'pick' ? (
              <input
                id="f-date"
                className="input input--date"
                type="date"
                value={lastDate}
                max={today}
                aria-label="前回やった日"
                aria-invalid={!!errors.lastDate}
                onChange={(e) => {
                  setLastDate(e.target.value);
                  if (errors.lastDate) setErrors({ ...errors, lastDate: undefined });
                }}
              />
            ) : null}
            {errors.lastDate ? (
              <p className="field-error">{errors.lastDate}</p>
            ) : isValidDateString(lastDate) ? (
              <p className="field-help">{formatLong(lastDate)}</p>
            ) : null}
          </fieldset>

          <fieldset className="field">
            <legend className="field-label">どのくらいの間隔でやる？</legend>
            <div className="choices" role="radiogroup" aria-label="次回の目安">
              {INTERVAL_CHOICES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="choice"
                  role="radio"
                  aria-checked={!useCustom && intervalDays === c.days}
                  onClick={() => {
                    setIntervalDays(c.days);
                    setUseCustom(false);
                    if (errors.interval) setErrors({ ...errors, interval: undefined });
                  }}
                >
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                className="choice"
                role="radio"
                aria-checked={useCustom}
                onClick={() => {
                  setUseCustom(true);
                  setTimeout(() => document.getElementById('f-interval')?.focus(), 50);
                }}
              >
                日数を入力
              </button>
            </div>
            {useCustom ? (
              <div className="interval-row">
                <input
                  id="f-interval"
                  className="input input--number"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={INTERVAL_MAX}
                  value={customInterval}
                  placeholder="10"
                  aria-label="目安の日数"
                  aria-invalid={!!errors.interval}
                  onChange={(e) => {
                    setCustomInterval(e.target.value);
                    if (errors.interval) setErrors({ ...errors, interval: undefined });
                  }}
                />
                <span className="interval-unit">日ごと</span>
              </div>
            ) : null}
            {errors.interval ? (
              <p id="f-interval-error" className="field-error">
                {errors.interval}
              </p>
            ) : (
              <p className="field-help">
                {!useCustom && intervalDays == null
                  ? '目安を決めずに、何日たったかだけを記録します。'
                  : '近づくと黄色、過ぎると赤で知らせます。'}
              </p>
            )}
          </fieldset>

          <fieldset className="field">
            <legend className="field-label">カテゴリー</legend>
            <div className="choices" role="radiogroup" aria-label="カテゴリー">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="choice choice--small"
                  role="radio"
                  aria-checked={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="form-submit">
            <button type="submit" className="btn btn--primary btn--large btn--block">
              {isEdit ? '保存する' : 'この内容で登録する'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
