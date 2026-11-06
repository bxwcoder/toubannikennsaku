// 画面の一番下の切り替えボタン（ホーム・設定）
import { navigate, replaceRoute } from '../lib/router';
import { IconHome, IconSettings } from './Icons';

interface Props {
  current: 'home' | 'settings';
}

export function BottomNav({ current }: Props) {
  const go = (name: 'home' | 'settings') => {
    if (name === current) return;
    // ホームと設定の行き来は履歴を増やさない（「戻る」で何度も往復しないように）
    if (name === 'home') replaceRoute({ name: 'home' });
    else navigate({ name: 'settings' });
  };

  return (
    <nav className="bottom-nav" aria-label="画面の切り替え">
      <button
        type="button"
        className="bottom-nav-item"
        aria-current={current === 'home' ? 'page' : undefined}
        onClick={() => go('home')}
      >
        <IconHome />
        <span>ホーム</span>
      </button>
      <button
        type="button"
        className="bottom-nav-item"
        aria-current={current === 'settings' ? 'page' : undefined}
        onClick={() => go('settings')}
      >
        <IconSettings />
        <span>設定</span>
      </button>
    </nav>
  );
}
