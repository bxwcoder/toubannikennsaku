// アプリ全体のまとめ役。データを持ち、どの画面を表示するか決める
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import type { Item, SortKey } from './types';
import { addDays, todayString } from './lib/date';
import { SAMPLE_ITEMS } from './lib/templates';
import { loadItems, loadSort, newId, saveItems, saveSort } from './lib/storage';
import { goBack, replaceRoute, useRoute } from './lib/router';
import { HomeScreen } from './screens/HomeScreen';
import { ItemFormScreen, type ItemFormValues } from './screens/ItemFormScreen';
import { DetailScreen } from './screens/DetailScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Toast, type ToastData } from './components/Toast';

/** 日付が変わったら（夜中の0時をまたいだら）「今日」を更新する */
function useToday(): string {
  const [today, setToday] = useState(todayString);
  useEffect(() => {
    const check = () => setToday(todayString());
    const timer = window.setInterval(check, 60 * 1000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);
  return today;
}

export default function App() {
  const route = useRoute();
  const today = useToday();
  const [items, setItems] = useState<Item[]>(loadItems);
  const [sortKey, setSortKey] = useState<SortKey>(loadSort);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    setToast({ id: Date.now(), message, actionLabel, onAction });
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  // データが変わるたびに保存する
  useEffect(() => {
    if (!saveItems(items)) {
      showToast('保存できませんでした。ブラウザの設定を確認してください');
    }
  }, [items, showToast]);

  const changeSort = (key: SortKey) => {
    setSortKey(key);
    saveSort(key);
  };

  const setLastDate = (id: string, date: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, lastDate: date } : it)));
  };

  /** ホーム画面の「今日やった」: すぐ更新し、「元に戻す」を出す */
  const doneTodayQuick = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const previous = target.lastDate;
    setLastDate(id, today);
    showToast(`「${target.name}」を記録しました（今日）`, '元に戻す', () => setLastDate(id, previous));
  };

  const addItem = (values: ItemFormValues) => {
    const item: Item = { id: newId(), createdAt: new Date().toISOString(), ...values };
    setItems((prev) => [...prev, item]);
    showToast(`「${item.name}」を登録しました`);
    goBack({ name: 'home' });
  };

  const updateItem = (id: string, values: ItemFormValues) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...values } : it)));
    showToast('保存しました');
    goBack({ name: 'detail', id });
  };

  const deleteItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast(target ? `「${target.name}」を削除しました` : '削除しました');
    goBack({ name: 'home' });
  };

  const loadSample = () => {
    const now = new Date().toISOString();
    setItems(
      SAMPLE_ITEMS.map((s) => ({
        id: newId(),
        name: s.name,
        category: s.category,
        lastDate: addDays(today, -s.daysAgo),
        intervalDays: s.intervalDays,
        createdAt: now,
      })),
    );
    showToast('見本を入れました');
  };

  const importItems = (imported: Item[]) => {
    setItems(imported);
    showToast(`${imported.length}件の項目を読み込みました`);
  };

  // 表示する画面を決める
  let screen: ReactElement | null;

  switch (route.name) {
    case 'home':
      screen = (
        <HomeScreen
          items={items}
          today={today}
          sortKey={sortKey}
          onSortChange={changeSort}
          onDoneToday={doneTodayQuick}
          onLoadSample={loadSample}
        />
      );
      break;
    case 'settings':
      screen = (
        <SettingsScreen
          items={items}
          today={today}
          onImport={importItems}
          onMessage={showToast}
          onBack={() => goBack({ name: 'home' })}
        />
      );
      break;
    case 'new':
      screen = <ItemFormScreen today={today} onSubmit={addItem} onBack={() => goBack({ name: 'home' })} />;
      break;
    case 'detail':
    case 'edit': {
      const item = items.find((it) => it.id === route.id);
      if (!item) {
        // 削除済みなどで見つからないときはホームへ
        screen = <MissingItem />;
        break;
      }
      screen =
        route.name === 'detail' ? (
          <DetailScreen
            item={item}
            today={today}
            onBack={() => goBack({ name: 'home' })}
            onDoneToday={() => {
              setLastDate(item.id, today);
              showToast(`「${item.name}」を記録しました（今日）`);
            }}
            onDelete={() => deleteItem(item.id)}
          />
        ) : (
          <ItemFormScreen
            key={item.id}
            initial={item}
            today={today}
            onSubmit={(values) => updateItem(item.id, values)}
            onBack={() => goBack({ name: 'detail', id: item.id })}
          />
        );
      break;
    }
  }

  return (
    <div className="app">
      {screen}
      <Toast toast={toast} onClose={closeToast} offset={route.name === 'home' && items.length > 0 ? 'fab' : 'none'} />
    </div>
  );
}

function MissingItem() {
  useEffect(() => {
    replaceRoute({ name: 'home' });
  }, []);
  return null;
}
