import { dayKey, formatDuration, lastNDays, streakDays, totalsByDay, type Session, type Settings } from '../lib/storage';

interface Props {
  settings: Settings;
  sessions: Session[];
  error: string | null;
  onStart: () => void;
  onOpenSettings: () => void;
  onDelete: (id: string) => void;
}

export function Home({ settings, sessions, error, onStart, onOpenSettings, onDelete }: Props) {
  const today = totalsByDay(sessions).get(dayKey(Date.now())) ?? { activeMs: 0, jumps: 0, kcal: 0 };
  const goalMs = settings.dailyGoalMin * 60000;
  const progress = Math.min(1, today.activeMs / goalMs);
  const streak = streakDays(sessions);
  const week = lastNDays(sessions, 7);
  const weekMax = Math.max(goalMs, ...week.map((d) => d.activeMs));
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div className="screen home">
      <header className="topbar">
        <h1>なわとびタイマー</h1>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="設定">⚙︎</button>
      </header>

      <section className="card ring-card">
        <svg viewBox="0 0 180 180" className="ring" role="img" aria-label={`今日の目標 ${Math.round(progress * 100)}%`}>
          <circle cx="90" cy="90" r={R} className="ring-bg" />
          <circle
            cx="90" cy="90" r={R} className="ring-fg"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            transform="rotate(-90 90 90)"
          />
          <text x="90" y="86" className="ring-main">{formatDuration(today.activeMs)}</text>
          <text x="90" y="112" className="ring-sub">目標 {settings.dailyGoalMin}分</text>
        </svg>
        <div className="ring-stats">
          <div><b>{today.jumps}</b><span>回</span></div>
          <div><b>{Math.round(today.kcal)}</b><span>kcal</span></div>
          <div><b>{streak}</b><span>日連続</span></div>
        </div>
      </section>

      <section className="card">
        <h2>この7日間</h2>
        <div className="bars">
          {week.map((d, i) => (
            <div key={i} className={`bar ${d.isToday ? 'today' : ''}`}>
              <div className="bar-track">
                <div
                  className={`bar-fill ${d.activeMs >= goalMs ? 'done' : ''}`}
                  style={{ height: `${(d.activeMs / weekMax) * 100}%` }}
                  title={formatDuration(d.activeMs)}
                />
                <div className="bar-goal" style={{ bottom: `${(goalMs / weekMax) * 100}%` }} />
              </div>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="warn">{error}</p>}

      <button className="btn btn-primary btn-big" onClick={onStart}>
        はじめる
      </button>
      <p className="hint">スマホをズボンの前ポケットに入れて跳ぶと、跳んでいる時間だけ自動で計測します。</p>

      <section className="card">
        <h2>履歴</h2>
        {sessions.length === 0 ? (
          <p className="muted">まだ記録がありません。</p>
        ) : (
          <ul className="history">
            {sessions.slice(0, 30).map((s) => (
              <li key={s.id}>
                <div>
                  <div className="h-date">{new Date(s.startedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="muted small">{s.jumps}回 ・ {Math.round(s.kcal)}kcal{s.avgCadence ? ` ・ ${s.avgCadence}回/分` : ''}</div>
                </div>
                <div className="h-right">
                  <b>{formatDuration(s.activeMs)}</b>
                  <button className="link" onClick={() => confirm('この記録を削除しますか？') && onDelete(s.id)}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
