/** DeviceMotion（加速度センサー）のラッパー */

type PermissionFn = () => Promise<'granted' | 'denied'>;

export function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/** iOS 13+ はユーザー操作（タップ）の中で許可を求める必要がある */
export async function requestMotionPermission(): Promise<boolean> {
  const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: PermissionFn } }).DeviceMotionEvent;
  if (DME && typeof DME.requestPermission === 'function') {
    try {
      return (await DME.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }
  return isMotionSupported();
}

const G = 9.80665;

/** 合成加速度 (g) を通知する。戻り値は停止関数 */
export function startMotion(onSample: (t: number, g: number) => void): () => void {
  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / G;
    onSample(performance.now(), mag);
  };
  window.addEventListener('devicemotion', handler);
  return () => window.removeEventListener('devicemotion', handler);
}
