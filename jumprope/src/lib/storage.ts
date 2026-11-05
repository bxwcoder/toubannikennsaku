/** 設定と記録の保存（試作版は端末内 localStorage） */

export type Sensitivity = 'high' | 'normal' | 'low';

export interface Settings {
  weightKg: number;
  dailyGoalMin: number;
  sensitivity: Sensitivity;
  voice: boolean;
  demo: boolean;
}

export interface Session {
  id: string;
  startedAt: number; // epoch ms
  activeMs: number;
  jumps: number;
  kcal: number;
  avgCadence: number;
}

export const DEFAULT_SETTINGS: Settings = {
  weightKg: 60,
  dailyGoalMin: 10,
  sensitivity: 'normal',
  voice: true,
  demo: false,
};

export const SENSITIVITY_G: Record<Sensitivity, number> = { high: 1.6, normal: 2.0, low: 2.5 };

const K_SETTINGS = 'jr.settings.v1';
const K_SESSIONS = 'jr.sessions.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* プライベートモード等では保存できない */
  }
}

export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(K_SETTINGS, {}) });
export const saveSettings = (s: Settings) => write(K_SETTINGS, s);
export const loadSessions = (): Session[] => read<Session[]>(K_SESSIONS, []);

export function addSession(s: Session): Session[] {
  const all = [s, ...loadSessions()];
  write(K_SESSIONS, all);
  return all;
}

export function deleteSession(id: string): Session[] {
  const all = loadSessions().filter((s) => s.id !== id);
  write(K_SESSIONS, all);
  return all;
}

// ---- 集計 ----

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function totalsByDay(sessions: Session[]): Map<string, { activeMs: number; jumps: number; kcal: number }> {
  const m = new Map<string, { activeMs: number; jumps: number; kcal: number }>();
  for (const s of sessions) {
    const k = dayKey(s.startedAt);
    const cur = m.get(k) ?? { activeMs: 0, jumps: 0, kcal: 0 };
    cur.activeMs += s.activeMs;
    cur.jumps += s.jumps;
    cur.kcal += s.kcal;
    m.set(k, cur);
  }
  return m;
}

/** 連続日数（今日まだ跳んでいなくても昨日まで続いていれば継続扱い） */
export function streakDays(sessions: Session[], now = Date.now()): number {
  const days = totalsByDay(sessions);
  const d = new Date(now);
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function lastNDays(sessions: Session[], n: number, now = Date.now()) {
  const days = totalsByDay(sessions);
  const out: { label: string; activeMs: number; isToday: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({
      label: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()],
      activeMs: days.get(dayKey(d.getTime()))?.activeMs ?? 0,
      isToday: i === 0,
    });
  }
  return out;
}

export function formatDuration(ms: number, withTenths = false): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  const base = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return withTenths ? `${base}.${Math.floor((ms % 1000) / 100)}` : base;
}
