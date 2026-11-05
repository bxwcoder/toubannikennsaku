/**
 * 縄跳び検出エンジン（UI・センサーAPIに依存しない純粋なロジック）
 *
 * 入力: 合成加速度 |a|（単位 g、重力込み。静止時 ≈ 1.0）とタイムスタンプ(ms)
 * 判定:
 *  1. 着地衝撃のピーク検出（しきい値 + ヒステリシス + 不応期）
 *  2. ピーク間隔が縄跳びのリズム範囲内で連続しているか
 *  3. 一定回数連続したら「跳躍中」、一定時間ピークが途絶えたら「休憩」
 * 跳躍中と判定された区間の時間だけを積算する。
 */

export interface DetectorConfig {
  /** 着地とみなすピークのしきい値 (g)。歩行は概ね 1.2〜1.6g、縄跳びは 2.5g 以上 */
  peakThresholdG: number;
  /** ピーク終了判定のヒステリシス幅 (g) */
  hysteresisG: number;
  /** 縄跳びとみなすピーク間隔の下限・上限 (ms) */
  minIntervalMs: number;
  maxIntervalMs: number;
  /** 跳躍開始と判定するのに必要な連続ジャンプ数 */
  startJumps: number;
  /** 最後のジャンプからこの時間ピークがなければ停止 (ms) */
  stopGapMs: number;
  /** 平滑化係数 (0-1, 大きいほど生値に近い) */
  smoothing: number;
}

export const DEFAULT_CONFIG: DetectorConfig = {
  peakThresholdG: 2.0,
  hysteresisG: 0.4,
  minIntervalMs: 250,
  maxIntervalMs: 1100,
  startJumps: 4,
  stopGapMs: 1500,
  smoothing: 0.6,
};

export type DetectorState = 'idle' | 'jumping';

export interface DetectorEvent {
  type: 'start' | 'stop' | 'jump';
  t: number;
}

export interface DetectorSnapshot {
  state: DetectorState;
  /** 跳んでいた合計時間 (ms) */
  activeMs: number;
  /** 確定したジャンプ回数 */
  jumps: number;
  /** 直近のテンポ (回/分)。不明なら 0 */
  cadence: number;
  /** 平滑化後の現在値 (g) */
  value: number;
}

export class JumpDetector {
  private cfg: DetectorConfig;
  private smoothed = 1;
  private hasValue = false;

  // ピーク検出
  private inPeak = false;
  private peakMax = 0;
  private peakTime = 0;

  // リズム判定
  private lastPeakT = -Infinity;
  /** 連続して条件を満たしたピーク（idle中の候補） */
  private candidate: number[] = [];
  private intervals: number[] = [];

  // 状態・集計
  private state: DetectorState = 'idle';
  private segmentStart = 0;
  private closedMs = 0;
  private jumps = 0;
  private lastT = 0;

  constructor(cfg: Partial<DetectorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
  }

  setConfig(cfg: Partial<DetectorConfig>) {
    this.cfg = { ...this.cfg, ...cfg };
  }

  reset() {
    const cfg = this.cfg;
    Object.assign(this, new JumpDetector(cfg));
  }

  /** サンプルを1つ入力し、発生したイベントを返す */
  push(t: number, magnitudeG: number): DetectorEvent[] {
    const events: DetectorEvent[] = [];
    this.lastT = t;
    const a = this.cfg.smoothing;
    this.smoothed = this.hasValue ? a * magnitudeG + (1 - a) * this.smoothed : magnitudeG;
    this.hasValue = true;
    const v = this.smoothed;

    // --- ピーク検出 ---
    if (!this.inPeak) {
      if (v >= this.cfg.peakThresholdG) {
        this.inPeak = true;
        this.peakMax = v;
        this.peakTime = t;
      }
    } else {
      if (v > this.peakMax) {
        this.peakMax = v;
        this.peakTime = t;
      }
      if (v < this.cfg.peakThresholdG - this.cfg.hysteresisG) {
        this.inPeak = false;
        this.onPeak(this.peakTime, events);
      }
    }

    // --- 停止判定 ---
    if (this.state === 'jumping' && t - this.lastPeakT > this.cfg.stopGapMs) {
      this.closedMs += this.segmentEnd() - this.segmentStart;
      this.state = 'idle';
      this.candidate = [];
      events.push({ type: 'stop', t });
    }
    return events;
  }

  private onPeak(t: number, events: DetectorEvent[]) {
    const dt = t - this.lastPeakT;
    if (dt < this.cfg.minIntervalMs) return; // 同一着地の二重検出は無視
    this.lastPeakT = t;
    const rhythmic = dt <= this.cfg.maxIntervalMs;
    if (rhythmic) {
      this.intervals.push(dt);
      if (this.intervals.length > 8) this.intervals.shift();
    }

    if (this.state === 'jumping') {
      // 跳躍中: リズム内ならカウント（間隔が空いた場合は stop 判定が先に走る）
      this.jumps++;
      events.push({ type: 'jump', t });
      return;
    }

    // idle 中: 連続ピークを候補として蓄積
    if (!rhythmic) this.candidate = [];
    this.candidate.push(t);
    if (this.candidate.length >= this.cfg.startJumps) {
      this.state = 'jumping';
      // 判定待ちの間の時間・回数もさかのぼって計上する
      this.segmentStart = this.candidate[0] - this.typicalInterval() / 2;
      this.jumps += this.candidate.length;
      events.push({ type: 'start', t: this.segmentStart });
      for (const ct of this.candidate) events.push({ type: 'jump', t: ct });
      this.candidate = [];
    }
  }

  private typicalInterval(): number {
    if (this.intervals.length === 0) return 450;
    const s = [...this.intervals].sort((x, y) => x - y);
    return s[Math.floor(s.length / 2)];
  }

  /** 現在の区間の終端: 最後の着地 + 半周期（ただし現在時刻まで） */
  private segmentEnd(): number {
    return Math.min(this.lastT, this.lastPeakT + this.typicalInterval() / 2);
  }

  snapshot(): DetectorSnapshot {
    const live = this.state === 'jumping' ? Math.max(0, this.segmentEnd() - this.segmentStart) : 0;
    const ti = this.typicalInterval();
    return {
      state: this.state,
      activeMs: this.closedMs + live,
      jumps: this.jumps,
      cadence: this.state === 'jumping' && this.intervals.length > 0 ? Math.round(60000 / ti) : 0,
      value: this.smoothed,
    };
  }
}
