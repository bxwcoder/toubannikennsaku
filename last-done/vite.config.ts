import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 通常: リポジトリ直下の docs フォルダに出力（GitHub Pages 用）
// artifact: claude.ai のページ用に、1つのファイルにまとめる下準備をして dist-artifact に出力
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  build:
    mode === 'artifact'
      ? {
          outDir: 'dist-artifact',
          emptyOutDir: true,
          cssCodeSplit: false,
          assetsInlineLimit: 100_000_000,
          modulePreload: false,
        }
      : {
          outDir: '../docs',
          emptyOutDir: true,
        },
}));
