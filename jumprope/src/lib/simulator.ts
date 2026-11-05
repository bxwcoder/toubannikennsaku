/**
 * 疑似加速度信号ジェネレーター（PCでの動作確認・テスト用）
 */

export type SimPhase =
  | { kind: 'jump'; seconds: number; cadence?: number; peakG?: number }
  | { kind: 'walk'; seconds: number }
  | { kind: 'rest'; seconds: number };

/** 擬似乱数（テストを再現可能にするためシード固定） */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const bump = (x: number, width: number) => Math.exp(-(x * x) / (2 * width * width));

/** 指定時刻 (秒、フェーズ先頭からの相対) における加速度 (g) */
function sampleAt(phase: SimPhase, tSec: number, noise: number): number {
  switch (phase.kind) {
    case 'rest':
      return 1 + noise * 0.05;
    case 'walk': {
      const period = 1 / 1.8;
      const x = tSec % period;
      return 1 + 0.45 * bump(x - 0.08, 0.05) - 0.15 * bump(x - 0.3, 0.08) + noise * 0.08;
    }
    case 'jump': {
      const period = 60 / (phase.cadence ?? 130);
      const peak = phase.peakG ?? 3.2;
      const x = tSec % period;
      // 着地の衝撃 + 滞空中のほぼ無重力
      const impact = (peak - 1) * bump(x - 0.05, 0.03);
      const flight = x > 0.15 && x < period - 0.03 ? -0.65 : 0;
      return 1 + impact + flight + noise * 0.15;
    }
  }
}

export interface SimSample {
  t: number;
  g: number;
}

/** フェーズ列からサンプル列を生成 */
export function generate(phases: SimPhase[], hz = 60, seed = 1): SimSample[] {
  const rand = rng(seed);
  const out: SimSample[] = [];
  let base = 0;
  for (const p of phases) {
    const n = Math.round(p.seconds * hz);
    for (let i = 0; i < n; i++) {
      const tSec = i / hz;
      out.push({ t: (base + tSec) * 1000, g: Math.max(0, sampleAt(p, tSec, rand() * 2 - 1)) });
    }
    base += p.seconds;
  }
  return out;
}

/** デモ用の無限シナリオ: 跳ぶ→休憩→歩く→跳ぶ… */
export const DEMO_SCENARIO: SimPhase[] = [
  { kind: 'rest', seconds: 3 },
  { kind: 'jump', seconds: 20, cadence: 125 },
  { kind: 'rest', seconds: 6 },
  { kind: 'walk', seconds: 8 },
  { kind: 'jump', seconds: 25, cadence: 140 },
  { kind: 'rest', seconds: 8 },
];

/** リアルタイムに疑似サンプルを流す。戻り値は停止関数 */
export function startSimulation(onSample: (t: number, g: number) => void, hz = 60): () => void {
  const total = DEMO_SCENARIO.reduce((s, p) => s + p.seconds, 0);
  const t0 = performance.now();
  const rand = rng(Date.now());
  let i = 0;
  const id = setInterval(() => {
    const now = performance.now();
    // 経過時間分のサンプルをまとめて生成（タブ非アクティブ時の取りこぼし対策）
    while ((i * 1000) / hz <= now - t0) {
      const tMs = (i * 1000) / hz;
      let local = (tMs / 1000) % total;
      let phase = DEMO_SCENARIO[0];
      for (const p of DEMO_SCENARIO) {
        if (local < p.seconds) {
          phase = p;
          break;
        }
        local -= p.seconds;
      }
      onSample(tMs, Math.max(0, sampleAt(phase, local, rand() * 2 - 1)));
      i++;
    }
  }, 1000 / hz);
  return () => clearInterval(id);
}
