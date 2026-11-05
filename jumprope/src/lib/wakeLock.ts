/** 計測中に画面が消えないようにする（画面が消えるとブラウザはセンサーを止めるため） */
type Sentinel = { release: () => Promise<void> };

export async function acquireWakeLock(): Promise<() => void> {
  const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } };
  if (!nav.wakeLock) return () => {};
  let sentinel: Sentinel | null = null;
  let released = false;
  const request = async () => {
    try {
      sentinel = await nav.wakeLock!.request('screen');
    } catch {
      sentinel = null;
    }
  };
  // タブ復帰時は取り直す
  const onVisible = () => {
    if (!released && document.visibilityState === 'visible') void request();
  };
  await request();
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    released = true;
    document.removeEventListener('visibilitychange', onVisible);
    void sentinel?.release().catch(() => {});
  };
}
