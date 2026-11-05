import { describe, expect, it } from 'vitest';
import { JumpDetector } from './detector';
import { generate, type SimPhase } from './simulator';
import { estimateKcal } from './calories';

function run(phases: SimPhase[], hz = 60) {
  const d = new JumpDetector();
  const starts: number[] = [];
  const stops: number[] = [];
  for (const s of generate(phases, hz)) {
    for (const e of d.push(s.t, s.g)) {
      if (e.type === 'start') starts.push(e.t);
      if (e.type === 'stop') stops.push(e.t);
    }
  }
  return { ...d.snapshot(), starts, stops };
}

describe('JumpDetector', () => {
  it('30秒の縄跳びをほぼ30秒・正しい回数で計測する', () => {
    const r = run([{ kind: 'rest', seconds: 2 }, { kind: 'jump', seconds: 30, cadence: 120 }, { kind: 'rest', seconds: 3 }]);
    expect(r.activeMs / 1000).toBeGreaterThan(29);
    expect(r.activeMs / 1000).toBeLessThan(31);
    expect(r.jumps).toBeGreaterThanOrEqual(58);
    expect(r.jumps).toBeLessThanOrEqual(61);
    expect(r.state).toBe('idle');
  });

  it('歩行はカウントしない', () => {
    const r = run([{ kind: 'walk', seconds: 60 }]);
    expect(r.activeMs).toBe(0);
    expect(r.jumps).toBe(0);
  });

  it('静止はカウントしない', () => {
    const r = run([{ kind: 'rest', seconds: 60 }]);
    expect(r.activeMs).toBe(0);
  });

  it('休憩をはさむと休憩中は計測しない', () => {
    const r = run([
      { kind: 'jump', seconds: 15, cadence: 130 },
      { kind: 'rest', seconds: 10 },
      { kind: 'walk', seconds: 10 },
      { kind: 'jump', seconds: 15, cadence: 130 },
      { kind: 'rest', seconds: 3 },
    ]);
    expect(r.activeMs / 1000).toBeGreaterThan(29);
    expect(r.activeMs / 1000).toBeLessThan(31);
    expect(r.starts).toHaveLength(2);
    expect(r.stops).toHaveLength(2);
  });

  it('ゆっくり(90回/分)・速い(180回/分)跳びにも対応する', () => {
    for (const cadence of [90, 180]) {
      const r = run([{ kind: 'jump', seconds: 20, cadence }, { kind: 'rest', seconds: 3 }]);
      expect(r.activeMs / 1000).toBeGreaterThan(19);
      expect(r.activeMs / 1000).toBeLessThan(21);
      expect(Math.abs(r.jumps - (cadence / 3))).toBeLessThanOrEqual(2);
    }
  });

  it('サンプリング周波数が低くても (30Hz) 動く', () => {
    const r = run([{ kind: 'jump', seconds: 20, cadence: 120 }, { kind: 'rest', seconds: 3 }], 30);
    expect(r.activeMs / 1000).toBeGreaterThan(19);
    expect(r.activeMs / 1000).toBeLessThan(21);
  });
});

describe('estimateKcal', () => {
  it('60kgで10分・120回/分 ≈ 120kcal前後', () => {
    const kcal = estimateKcal(60, 10 * 60 * 1000, 120);
    expect(kcal).toBeGreaterThan(100);
    expect(kcal).toBeLessThan(140);
  });
});
