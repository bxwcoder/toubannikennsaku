// 状態を色と文字で表示する小さな札（例:「5日超過」）
import type { Status } from '../types';

interface Props {
  status: Status;
  label: string;
}

export function StatusBadge({ status, label }: Props) {
  return <span className={`badge badge--${status}`}>{label}</span>;
}
