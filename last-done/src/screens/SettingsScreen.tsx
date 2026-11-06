// ④ 設定画面
import { useRef, useState, type ChangeEvent } from 'react';
import type { Item } from '../types';
import { exportItems, parseBackup } from '../lib/storage';
import { Header } from '../components/Header';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconChevron, IconDownload, IconInfo, IconUpload } from '../components/Icons';

interface Props {
  items: Item[];
  today: string;
  onImport: (items: Item[]) => void;
  onMessage: (message: string) => void;
  onBack: () => void;
}

export const APP_VERSION = '0.1.0（画面見本）';

export function SettingsScreen({ items, today, onImport, onMessage, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Item[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const handleExport = async () => {
    if (items.length === 0) {
      onMessage('書き出す項目がありません');
      return;
    }
    const result = await exportItems(items, today);
    if (result === 'saved') onMessage('バックアップファイルを保存しました');
    else if (result === 'declined') onMessage('保存を取りやめました');
    else onMessage('この画面ではファイルを保存できませんでした');
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じファイルをもう一度選べるようにする
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      setPending(parseBackup(text));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'ファイルを読み込めませんでした。');
    }
  };

  return (
    <>
      <Header title="設定" onBack={onBack} />
      <main className="screen">
        <h2 className="section-title section-title--list">バックアップ</h2>
        <ul className="menu">
          <li>
            <button type="button" className="menu-item" onClick={handleExport}>
              <IconDownload />
              <span className="menu-text">
                <span className="menu-label">データの書き出し</span>
                <span className="menu-help">登録内容をファイルに保存します（{items.length}件）</span>
              </span>
              <IconChevron className="menu-chevron" />
            </button>
          </li>
          <li>
            <button type="button" className="menu-item" onClick={() => fileRef.current?.click()}>
              <IconUpload />
              <span className="menu-text">
                <span className="menu-label">データの読み込み</span>
                <span className="menu-help">書き出したファイルから元に戻します</span>
              </span>
              <IconChevron className="menu-chevron" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              tabIndex={-1}
              aria-hidden="true"
              onChange={handleFile}
            />
          </li>
        </ul>
        {importError ? (
          <p className="notice notice--error" role="alert">
            {importError}
          </p>
        ) : null}

        <h2 className="section-title section-title--list">このアプリ</h2>
        <ul className="menu">
          <li>
            <button
              type="button"
              className="menu-item"
              aria-expanded={showAbout}
              onClick={() => setShowAbout((v) => !v)}
            >
              <IconInfo />
              <span className="menu-text">
                <span className="menu-label">アプリについて</span>
              </span>
              <IconChevron className={showAbout ? 'menu-chevron menu-chevron--open' : 'menu-chevron'} />
            </button>
            {showAbout ? (
              <div className="about">
                <p>
                  <strong>最後にやった日</strong>
                  <br />
                  バージョン {APP_VERSION}
                </p>
                <p>家事や消耗品の交換など、「前にいつやったっけ？」を記録するアプリです。</p>
                <ul>
                  <li>やった日に「今日やった」を押すだけで記録できます。</li>
                  <li>目安の日数を決めておくと、近づくと黄色、過ぎると赤で知らせます。</li>
                  <li>データはこの端末の中だけに保存されます。アカウント登録や広告はありません。</li>
                  <li>機種変更などに備えて、ときどき「データの書き出し」をしておくと安心です。</li>
                </ul>
              </div>
            ) : null}
          </li>
        </ul>
      </main>

      {pending ? (
        <ConfirmDialog
          title="データを読み込みますか？"
          message={`ファイルの${pending.length}件の項目を読み込みます。今の${items.length}件の項目は置き換わり、元に戻せません。`}
          confirmLabel="読み込む"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onImport(pending);
            setPending(null);
          }}
        />
      ) : null}
    </>
  );
}
