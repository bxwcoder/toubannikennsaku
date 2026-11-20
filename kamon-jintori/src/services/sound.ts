// 効果音（音のファイルを使わず、その場で音を作る。アプリが軽くなり、著作権の心配もない）
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function getContext(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 1つの音を鳴らす（すっと消える、柔らかい音） */
function tone(freq: number, delay: number, duration: number, type: OscillatorType, volume: number) {
  const c = getContext();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sound = {
  /** ×を付けた・消した */
  tap: () => tone(700, 0, 0.06, 'triangle', 0.05),
  /** 家紋を置いた（木を軽くたたいたような音） */
  place: () => {
    tone(420, 0, 0.14, 'triangle', 0.14);
    tone(840, 0, 0.07, 'sine', 0.04);
  },
  /** ルール違反 */
  error: () => tone(180, 0, 0.22, 'square', 0.03),
  /** ヒント */
  hint: () => {
    tone(880, 0, 0.18, 'sine', 0.07);
    tone(1175, 0.08, 0.22, 'sine', 0.05);
  },
  /** クリア（和風の音階で上がっていく） */
  clear: () => {
    [523, 587, 698, 784, 932, 1047].forEach((f, i) => tone(f, i * 0.09, 0.5, 'triangle', 0.09));
    tone(1568, 0.6, 0.9, 'sine', 0.05);
  },
};
