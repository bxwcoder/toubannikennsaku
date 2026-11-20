// Androidアプリにするための設定（Capacitor）
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // アプリの識別名（Google Playで世界に1つだけの名前。公開後は変更できない）
  appId: 'io.github.bxwcoder.kamonjintori',
  // スマホのホーム画面に表示される名前
  appName: '家紋陣取り',
  // 組み立てたゲームの置き場所
  webDir: 'dist',
  android: {
    // 和紙色の背景（読み込み中に一瞬白くならないように）
    backgroundColor: '#f3ece0',
  },
  plugins: {
    SystemBars: {
      // 画面上部の時計や電池のアイコンを濃い色にする（明るい和紙色の背景でも見えるように）
      style: 'LIGHT',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
