import { useRef, useState } from 'react';

interface Props {
  timeText: string;
  jumping: boolean;
  onUnlock: () => void;
}

const HOLD_MS = 1200;

/** ポケット内の誤タッチ防止画面。長押しでのみ解除できる */
export function PocketLock({ timeText, jumping, onUnlock }: Props) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);

  const start = () => {
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        cancel();
        onUnlock();
      } else timer.current = requestAnimationFrame(tick);
    };
    timer.current = requestAnimationFrame(tick);
  };
  const cancel = () => {
    if (timer.current != null) cancelAnimationFrame(timer.current);
    timer.current = null;
    setProgress(0);
  };

  return (
    <div className="lock" onContextMenu={(e) => e.preventDefault()}>
      <div className={`lock-time ${jumping ? 'on' : ''}`}>{timeText}</div>
      <div className="lock-state">{jumping ? '計測中' : '待機中'}</div>
      <button
        className="lock-btn"
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        style={{ ['--p' as string]: progress }}
      >
        長押しで解除
      </button>
    </div>
  );
}
