// ② 項目登録画面（編集画面としても使う）
import { useState, type FormEvent } from 'react';
import { CATEGORIES, type Category, type Item } from '../types';
import { TEMPLATES, type Template } from '../lib/templates';
import { isValidDateString } from '../lib/date';
import { Header } from '../components/Header';

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
}

const NAME_MAX = 40;
const INTERVAL_MAX = 3650;

interface Errors {
  name?: string;
  lastDate?: string;
  intervalText?: string;
}

export function ItemFormScreen({ initial, today, onSubmit, onBack }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? '家事・掃除');
  const [lastDate, setLastDate] = useState(initial?.lastDate ?? today);
  const [noInterval, setNoInterval] = useState(initial ? initial.intervalDays == null : false);
  const [intervalText, setIntervalText] = useState(initial?.intervalDays != null ? String(initial.intervalDays) : '30');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const applyTemplate = (t: Template) => {
    setName(t.name);
    setCategory(t.category);
    setNoInterval(false);
    setIntervalText(String(t.intervalDays));
    setSelectedTemplate(t.name);
    setErrors({});
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = '項目名を入力してください';
    if (!isValidDateString(lastDate)) e.lastDate = '日付を選んでください';
    else if (lastDate > today) e.lastDate = '未来の日付は選べません';
    if (!noInterval) {
      const n = Number(intervalText);
      if (!intervalText.trim() || !Number.isInteger(n) || n < 1 || n > INTERVAL_MAX) {
        e.intervalText = `1〜${INTERVAL_MAX}の数字を入力してください（目安なしにする場合は下のチェックを入れてください）`;
      }
    }
    return e;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // 最初のエラーの欄へ移動する
      const firstId = e.name ? 'f-name' : e.lastDate ? 'f-date' : 'f-interval';
      document.getElementById(firstId)?.focus();
      return;
    }
    onSubmit({
      name: name.trim(),
      category,
      lastDate,
      intervalDays: noInterval ? null : Number(intervalText),
    });
  };

  return (
    <>
      <Header title={isEdit ? '項目を編集' : '項目を追加'} onBack={onBack} />
      <main className="screen screen--form">
        <form onSubmit={handleSubmit} noValidate>
          {!isEdit ? (
            <section className="section">
              <h2 className="section-title">よく使う項目から選ぶ</h2>
              <p className="section-help">選んだあとも、下の内容は自由に変えられます。</p>
              <div className="chips">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    className="chip"
                    aria-pressed={selectedTemplate === t.name}
                    onClick={() => applyTemplate(t)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="section">
            <div className="field">
              <label htmlFor="f-name" className="field-label">
                項目名 <span className="required">必須</span>
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
                  setSelectedTemplate(null);
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
              <legend className="field-label">カテゴリー</legend>
              <div className="chips">
                {CATEGORIES.map((c) => (
                  <label key={c} className="chip chip--radio">
                    <input
                      type="radio"
                      name="category"
                      value={c}
                      checked={category === c}
                      onChange={() => setCategory(c)}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field">
              <label htmlFor="f-date" className="field-label">
                前回やった日
              </label>
              <input
                id="f-date"
                className="input"
                type="date"
                value={lastDate}
                max={today}
                aria-invalid={!!errors.lastDate}
                aria-describedby={errors.lastDate ? 'f-date-error' : undefined}
                onChange={(e) => {
                  setLastDate(e.target.value);
                  if (errors.lastDate) setErrors({ ...errors, lastDate: undefined });
                }}
              />
              {errors.lastDate ? (
                <p id="f-date-error" className="field-error">
                  {errors.lastDate}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="f-interval" className="field-label">
                次回の目安 <span className="optional">なくてもOK</span>
              </label>
              <div className="interval-row">
                <input
                  id="f-interval"
                  className="input input--number"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={INTERVAL_MAX}
                  value={noInterval ? '' : intervalText}
                  disabled={noInterval}
                  aria-invalid={!!errors.intervalText}
                  aria-describedby={errors.intervalText ? 'f-interval-error' : 'f-interval-help'}
                  onChange={(e) => {
                    setIntervalText(e.target.value);
                    if (errors.intervalText) setErrors({ ...errors, intervalText: undefined });
                  }}
                />
                <span className="interval-unit">日ごと</span>
              </div>
              <p id="f-interval-help" className="field-help">
                この日数がたつと「目安を過ぎた」と表示します。
              </p>
              {errors.intervalText ? (
                <p id="f-interval-error" className="field-error">
                  {errors.intervalText}
                </p>
              ) : null}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={noInterval}
                  onChange={(e) => {
                    setNoInterval(e.target.checked);
                    if (errors.intervalText) setErrors({ ...errors, intervalText: undefined });
                  }}
                />
                <span>目安を設定しない</span>
              </label>
            </div>
          </section>

          <div className="form-submit">
            <button type="submit" className="btn btn--primary btn--large btn--block">
              {isEdit ? '保存する' : '登録する'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
