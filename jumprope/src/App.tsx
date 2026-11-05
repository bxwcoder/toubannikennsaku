import { useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { Workout } from './screens/Workout';
import { SettingsScreen } from './screens/SettingsScreen';
import { requestMotionPermission } from './lib/sensor';
import { setVoiceEnabled, unlockVoice } from './lib/voice';
import {
  addSession, dayKey, deleteSession, formatDuration, loadSessions, loadSettings, saveSettings, totalsByDay,
  type Session, type Settings,
} from './lib/storage';

type Screen = 'home' | 'workout' | 'settings' | 'summary';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [last, setLast] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveSettings(settings);
    setVoiceEnabled(settings.voice);
  }, [settings]);

  const start = async () => {
    setError(null);
    unlockVoice(); // iOS: タップ中に音声を有効化
    if (!settings.demo) {
      if (!window.isSecureContext) {
        setError('センサーを使うには HTTPS で開く必要があります。PCで試す場合は設定の「デモモード」をオンにしてください。');
        return;
      }
      const ok = await requestMotionPermission();
      if (!ok) {
        setError('モーションセンサーの使用が許可されませんでした。ブラウザの設定で「モーションと画面の向き」へのアクセスを許可してください。');
        return;
      }
    }
    setScreen('workout');
  };

  const finish = (s: Session | null) => {
    if (s) {
      setSessions(addSession(s));
      setLast(s);
      setScreen('summary');
    } else setScreen('home');
  };

  const todayMs = totalsByDay(sessions).get(dayKey(Date.now()))?.activeMs ?? 0;

  switch (screen) {
    case 'workout':
      return <Workout settings={settings} todayBeforeMs={todayMs} onFinish={finish} />;
    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          onChange={setSettings}
          onBack={() => setScreen('home')}
          onClearAll={() => {
            for (const s of sessions) deleteSession(s.id);
            setSessions([]);
          }}
        />
      );
    case 'summary':
      return last ? <Summary s={last} todayMs={todayMs} goalMin={settings.dailyGoalMin} onDone={() => setScreen('home')} /> : null;
    default:
      return (
        <Home
          settings={settings}
          sessions={sessions}
          error={error}
          onStart={start}
          onOpenSettings={() => setScreen('settings')}
          onDelete={(id) => setSessions(deleteSession(id))}
        />
      );
  }
}

function Summary({ s, todayMs, goalMin, onDone }: { s: Session; todayMs: number; goalMin: number; onDone: () => void }) {
  const achieved = todayMs >= goalMin * 60000;
  return (
    <div className="screen summary">
      <div className="summary-badge">{achieved ? '🎉 今日の目標達成！' : 'おつかれさまでした'}</div>
      <div className="timer on">{formatDuration(s.activeMs)}</div>
      <p className="muted center">跳んだ時間</p>
      <div className="stats">
        <div><b>{s.jumps}</b><span>回</span></div>
        <div><b>{s.avgCadence || '–'}</b><span>平均 回/分</span></div>
        <div><b>{Math.round(s.kcal)}</b><span>kcal（目安）</span></div>
      </div>
      <p className="muted center">今日の合計 {formatDuration(todayMs)} / 目標 {goalMin}分</p>
      <button className="btn btn-primary btn-big" onClick={onDone}>ホームへ</button>
    </div>
  );
}
