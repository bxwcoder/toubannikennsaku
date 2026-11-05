import { useEffect, useRef, useState } from 'react';
import { JumpDetector, type DetectorSnapshot } from '../lib/detector';
import { startMotion } from '../lib/sensor';
import { startSimulation } from '../lib/simulator';
import { acquireWakeLock } from '../lib/wakeLock';
import { say } from '../lib/voice';
import { estimateKcal } from '../lib/calories';
import { SENSITIVITY_G, formatDuration, type Session, type Settings } from '../lib/storage';
import { Waveform } from '../components/Waveform';
import { PocketLock } from '../components/PocketLock';

interface Props {
  settings: Settings;
  todayBeforeMs: number;
  onFinish: (s: Session | null) => void;
}

const EMPTY: DetectorSnapshot = { state: 'idle', activeMs: 0, jumps: 0, cadence: 0, value: 1 };

export function Workout({ settings, todayBeforeMs, onFinish }: Props) {
  const thresholdG = SENSITIVITY_G[settings.sensitivity];
  const detector = useRef(new JumpDetector({ peakThresholdG: thresholdG }));
  const wave = useRef<{ t: number; g: number }[]>([]);
  const rawLog = useRef<{ t: number; g: number }[]>([]);
  const cadenceSum = useRef({ sum: 0, n: 0 });
  const startedAt = useRef(Date.now());
  const [snap, setSnap] = useState<DetectorSnapshot>(EMPTY);
  const [locked, setLocked] = useState(false);
  const [noSignal, setNoSignal] = useState(false);

  // センサー（またはデモ信号）→ 検出器
  useEffect(() => {
    const d = detector.current;
    let lastAnnouncedMin = 0;
    let goalAnnounced = todayBeforeMs >= settings.dailyGoalMin * 60000;
    let gotSample = false;

    const onSample = (t: number, g: number) => {
      gotSample = true;
      if (rawLog.current.length < 400_000) rawLog.current.push({ t, g });

      for (const e of d.push(t, g)) {
        if (e.type === 'start') say('計測開始');
        if (e.type === 'stop') say(`休憩。${spokenDuration(d.snapshot().activeMs)}`);
      }
      const s = d.snapshot();
      const buf = wave.current;
      buf.push({ t, g: s.value });
      while (buf.length > 0 && t - buf[0].t > 5000) buf.shift();
      if (s.state === 'jumping' && s.cadence > 0) {
        cadenceSum.current.sum += s.cadence;
        cadenceSum.current.n++;
      }
      const min = Math.floor(s.activeMs / 60000);
      if (min > lastAnnouncedMin) {
        lastAnnouncedMin = min;
        if (!goalAnnounced && todayBeforeMs + s.activeMs >= settings.dailyGoalMin * 60000) {
          goalAnnounced = true;
          say(`${min}分。今日の目標達成です！`);
        } else say(`${min}分`);
      }
    };

    const stopSource = settings.demo ? startSimulation(onSample) : startMotion(onSample);
    const noSignalTimer = setTimeout(() => !gotSample && setNoSignal(true), 2000);
    let releaseWake = () => {};
    void acquireWakeLock().then((r) => (releaseWake = r));

    const ui = setInterval(() => setSnap(d.snapshot()), 100);
    return () => {
      stopSource();
      releaseWake();
      clearInterval(ui);
      clearTimeout(noSignalTimer);
    };
  }, [settings, todayBeforeMs]);

  const finish = () => {
    const s = detector.current.snapshot();
    if (s.activeMs < 3000) return onFinish(null);
    const avgCadence = cadenceSum.current.n ? Math.round(cadenceSum.current.sum / cadenceSum.current.n) : 0;
    onFinish({
      id: `${startedAt.current}`,
      startedAt: startedAt.current,
      activeMs: s.activeMs,
      jumps: s.jumps,
      avgCadence,
      kcal: estimateKcal(settings.weightKg, s.activeMs, avgCadence),
    });
  };

  const exportCsv = () => {
    const rows = ['t_ms,g', ...rawLog.current.map((r) => `${r.t.toFixed(1)},${r.g.toFixed(4)}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jumprope-${new Date(startedAt.current).toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const jumping = snap.state === 'jumping';
  const goalMs = settings.dailyGoalMin * 60000;
  const todayMs = todayBeforeMs + snap.activeMs;

  return (
    <div className="screen workout">
      <header className="topbar">
        <span className={`pill ${jumping ? 'pill-on' : ''}`}>
          <span className="dot" /> {jumping ? '跳んでいます' : '待機中（跳ぶと自動で計測）'}
        </span>
        {settings.demo && <span className="pill pill-demo">デモ</span>}
      </header>

      <div className={`timer ${jumping ? 'on' : ''}`}>{formatDuration(snap.activeMs, true)}</div>

      <div className="stats">
        <div><b>{snap.jumps}</b><span>回</span></div>
        <div><b>{snap.cadence || '–'}</b><span>回/分</span></div>
        <div><b>{Math.round(estimateKcal(settings.weightKg, snap.activeMs, snap.cadence))}</b><span>kcal</span></div>
      </div>

      <div className="goal-bar" aria-label="今日の目標">
        <div style={{ width: `${Math.min(100, (todayMs / goalMs) * 100)}%` }} />
        <span>今日 {formatDuration(todayMs)} / 目標 {settings.dailyGoalMin}分</span>
      </div>

      <Waveform samples={wave} thresholdG={thresholdG} active={jumping} />
      {noSignal && (
        <p className="warn">センサーの値が届いていません。HTTPSで開いているか、モーションの許可を確認してください（PCでは設定の「デモモード」を使えます）。</p>
      )}

      <div className="actions">
        <button className="btn btn-primary" onClick={() => setLocked(true)}>ポケットに入れる（画面ロック）</button>
        <div className="row">
          <button className="btn" onClick={exportCsv}>波形CSV</button>
          <button className="btn btn-danger" onClick={finish}>終了して保存</button>
        </div>
      </div>

      {locked && <PocketLock timeText={formatDuration(snap.activeMs)} jumping={jumping} onUnlock={() => setLocked(false)} />}
    </div>
  );
}

function spokenDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `合計${m}分${s}秒` : `合計${s}秒`;
}
