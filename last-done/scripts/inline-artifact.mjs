// dist-artifact に出力したファイルを、claude.ai のページ用に1つのHTMLファイルへまとめる
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
let html = readFileSync(join(dir, 'index.html'), 'utf8');

// CSS を埋め込む
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, file) => {
  return `<style>${readFileSync(join(dir, file), 'utf8')}</style>`;
});

// JavaScript を埋め込む（本文の最後に置く）
let scripts = '';
html = html.replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, file) => {
  const code = readFileSync(join(dir, file), 'utf8').replace(/<\/script/gi, '<\\/script');
  scripts += `<script type="module">${code}</script>`;
  return '';
});

const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '';
const styles = (html.match(/<style>[\s\S]*?<\/style>/g) ?? []).join('\n');
const body = html.match(/<body>([\s\S]*)<\/body>/)?.[1].trim() ?? '';

const out = `${title}\n${styles}\n${body}\n${scripts}\n`;
writeFileSync(join(dir, 'last-done.html'), out);
console.log(`dist-artifact/last-done.html を作成しました（${Math.round(out.length / 1024)} KB）`);
