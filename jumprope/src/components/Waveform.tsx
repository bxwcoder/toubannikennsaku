import { useEffect, useRef } from 'react';

interface Props {
  /** [t(ms), g] のリングバッファ（参照で渡し、描画ループで読む） */
  samples: React.MutableRefObject<{ t: number; g: number }[]>;
  thresholdG: number;
  active: boolean;
  windowMs?: number;
}

/** 加速度波形のリアルタイム表示（しきい値調整・デバッグ用） */
export function Waveform({ samples, thresholdG, active, windowMs = 4000 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = ref.current;
      const ctx = c?.getContext('2d');
      if (c && ctx) {
        const dpr = window.devicePixelRatio || 1;
        const w = c.clientWidth;
        const h = c.clientHeight;
        if (c.width !== w * dpr || c.height !== h * dpr) {
          c.width = w * dpr;
          c.height = h * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const maxG = 4;
        const y = (g: number) => h - (Math.min(g, maxG) / maxG) * h;

        // 1g 基準線としきい値線
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, y(1));
        ctx.lineTo(w, y(1));
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,196,0,0.6)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y(thresholdG));
        ctx.lineTo(w, y(thresholdG));
        ctx.stroke();
        ctx.setLineDash([]);

        const buf = samples.current;
        if (buf.length > 1) {
          const tEnd = buf[buf.length - 1].t;
          ctx.strokeStyle = activeRef.current ? '#3ee0a1' : '#8b93a1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          let started = false;
          for (const s of buf) {
            const x = w - ((tEnd - s.t) / windowMs) * w;
            if (x < 0) continue;
            if (!started) {
              ctx.moveTo(x, y(s.g));
              started = true;
            } else ctx.lineTo(x, y(s.g));
          }
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [samples, thresholdG, windowMs]);

  return <canvas ref={ref} className="waveform" aria-label="加速度の波形" />;
}
