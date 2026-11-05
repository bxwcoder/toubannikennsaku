/**
 * 消費カロリーの目安（METs法）
 * kcal = METs × 体重(kg) × 時間(h) × 1.05
 * METs値は「改訂版 身体活動のメッツ表」の縄跳びの値を参考に、テンポで切り替える。
 * ※あくまで目安。医療・診断目的ではない。
 */
export function metsForCadence(cadence: number): number {
  if (cadence <= 0) return 11.8;
  if (cadence < 100) return 8.8;
  if (cadence <= 120) return 11.8;
  return 12.3;
}

export function estimateKcal(weightKg: number, activeMs: number, cadence: number): number {
  const hours = activeMs / 3_600_000;
  return metsForCadence(cadence) * weightKg * hours * 1.05;
}
