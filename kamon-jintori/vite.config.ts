import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' にしておくと、後でAndroidアプリ（Capacitor）に入れたときもファイルが正しく読み込まれる
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
});
