import type { Sensitivity, Settings } from '../lib/storage';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onBack: () => void;
  onClearAll: () => void;
}

const SENS: { v: Sensitivity; label: string; desc: string }[] = [
  { v: 'high', label: '高い', desc: '軽く跳ぶ人・ゆるいポケット向け' },
  { v: 'normal', label: '標準', desc: 'おすすめ' },
  { v: 'low', label: '低い', desc: '歩いているのに計測されてしまうとき' },
];

export function SettingsScreen({ settings, onChange, onBack, onClearAll }: Props) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...settings, [k]: v });

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="戻る">←</button>
        <h1>設定</h1>
        <span />
      </header>

      <section className="card form">
        <label>
          <span>体重（消費カロリーの計算用）</span>
          <div className="input-unit">
            <input type="number" inputMode="decimal" min={20} max={200} value={settings.weightKg}
              onChange={(e) => set('weightKg', Number(e.target.value))}
              onBlur={() => set('weightKg', clamp(settings.weightKg, 20, 200))} />
            <span>kg</span>
          </div>
        </label>
        <label>
          <span>1日の目標</span>
          <div className="input-unit">
            <input type="number" inputMode="numeric" min={1} max={180} value={settings.dailyGoalMin}
              onChange={(e) => set('dailyGoalMin', Number(e.target.value))}
              onBlur={() => set('dailyGoalMin', clamp(Math.round(settings.dailyGoalMin), 1, 180))} />
            <span>分</span>
          </div>
        </label>
      </section>

      <section className="card form">
        <span className="label">検出の感度</span>
        <div className="segmented">
          {SENS.map((s) => (
            <button key={s.v} className={settings.sensitivity === s.v ? 'sel' : ''} onClick={() => set('sensitivity', s.v)}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="muted small">{SENS.find((s) => s.v === settings.sensitivity)?.desc}</p>
      </section>

      <section className="card form">
        <Toggle label="音声で知らせる" desc="計測開始・休憩・1分ごとに読み上げます" checked={settings.voice} onChange={(v) => set('voice', v)} />
        <Toggle label="デモモード" desc="センサーの代わりに疑似データで動作確認します（PC用）" checked={settings.demo} onChange={(v) => set('demo', v)} />
      </section>

      <section className="card">
        <button className="btn btn-danger" onClick={() => confirm('すべての記録を削除しますか？元に戻せません。') && onClearAll()}>
          すべての記録を削除
        </button>
      </section>

      <p className="muted small center">消費カロリーはMETs法による目安です。医療・診断を目的としたものではありません。</p>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <div>
        <div>{label}</div>
        <div className="muted small">{desc}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
