// 設定画面
import type { Settings } from '../services/storage';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onResetData: () => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, onResetData, onBack }: Props) {
  const handleReset = () => {
    if (window.confirm('クリア記録とベストタイムをすべて消します。よろしいですか？')) onResetData();
  };
  return (
    <div className="screen">
      <header className="bar">
        <button className="btn btn-small btn-ghost" onClick={onBack}>
          ‹ 戻る
        </button>
        <h2 className="bar-title">設定</h2>
        <span className="bar-side" />
      </header>

      <div className="settings">
        <label className="setting-row">
          <span>効果音</span>
          <input
            type="checkbox"
            className="switch"
            checked={settings.sound}
            onChange={(e) => onChange({ ...settings, sound: e.target.checked })}
          />
        </label>
        <label className="setting-row">
          <span>プレイ中に時間を表示</span>
          <input
            type="checkbox"
            className="switch"
            checked={settings.showTimer}
            onChange={(e) => onChange({ ...settings, showTimer: e.target.checked })}
          />
        </label>
        <button className="btn btn-danger" onClick={handleReset}>
          記録をすべて消す
        </button>
      </div>
    </div>
  );
}
