// 画面の一番上の帯（タイトルと「戻る」ボタン）
import type { ReactNode } from 'react';
import { IconBack } from './Icons';

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function Header({ title, onBack, right }: Props) {
  return (
    <header className="header">
      {onBack ? (
        <button type="button" className="header-back" onClick={onBack}>
          <IconBack />
          <span>戻る</span>
        </button>
      ) : null}
      <h1 className={onBack ? 'header-title header-title--sub' : 'header-title'}>{title}</h1>
      {right ? <div className="header-right">{right}</div> : null}
    </header>
  );
}
