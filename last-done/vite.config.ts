import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' … どの場所に置いても画面が開けるようにする設定（GitHub Pages用）
// outDir: '../docs' … 完成品を、リポジトリ直下の docs フォルダに出力する
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
