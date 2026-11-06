// 画面の切り替え（どの画面を表示するか）を管理するファイル
// 通常版: URLの「#」より後ろで画面を表す。スマホの「戻る」ボタンでも前の画面に戻れる
// claude.ai のページ版: URLを使えないので、アプリの中だけで画面の履歴を覚える
import { useEffect, useState } from 'react';
import { IS_ARTIFACT } from './env';

export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'new' }
  | { name: 'detail'; id: string }
  | { name: 'edit'; id: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'new') return { name: 'new' };
  if (parts[0] === 'item' && parts[1]) {
    const id = decodeURIComponent(parts[1]);
    return parts[2] === 'edit' ? { name: 'edit', id } : { name: 'detail', id };
  }
  return { name: 'home' };
}

export function routePath(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'settings':
      return '/settings';
    case 'new':
      return '/new';
    case 'detail':
      return `/item/${encodeURIComponent(route.id)}`;
    case 'edit':
      return `/item/${encodeURIComponent(route.id)}/edit`;
  }
}

/** アプリ内で何画面進んだか（0 ならアプリを開いた最初の画面） */
function currentDepth(): number {
  const state = window.history.state as { depth?: number } | null;
  return typeof state?.depth === 'number' ? state.depth : 0;
}

// ===== claude.ai のページ版で使う、アプリ内だけの画面履歴 =====
let memoryStack: Route[] = [{ name: 'home' }];
const listeners = new Set<() => void>();
function emitMemory() {
  listeners.forEach((fn) => fn());
  window.scrollTo(0, 0);
}

export function navigate(route: Route): void {
  if (IS_ARTIFACT) {
    memoryStack = [...memoryStack, route];
    emitMemory();
    return;
  }
  window.history.pushState({ depth: currentDepth() + 1 }, '', `#${routePath(route)}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** 前の画面へ戻る。アプリ内に戻り先がなければ fallback の画面にする */
export function goBack(fallback: Route): void {
  if (IS_ARTIFACT) {
    memoryStack = memoryStack.length > 1 ? memoryStack.slice(0, -1) : [fallback];
    emitMemory();
    return;
  }
  if (currentDepth() > 0) {
    window.history.back();
  } else {
    replaceRoute(fallback);
  }
}

export function replaceRoute(route: Route): void {
  if (IS_ARTIFACT) {
    memoryStack = [...memoryStack.slice(0, -1), route];
    emitMemory();
    return;
  }
  window.history.replaceState({ depth: currentDepth() }, '', `#${routePath(route)}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    IS_ARTIFACT ? memoryStack[memoryStack.length - 1] : parseRoute(window.location.hash),
  );

  useEffect(() => {
    if (IS_ARTIFACT) {
      const onChange = () => setRoute(memoryStack[memoryStack.length - 1]);
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    }
    if (window.history.state == null) {
      window.history.replaceState({ depth: 0 }, '', window.location.href);
    }
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  return route;
}
