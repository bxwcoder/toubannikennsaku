// アプリ全体: どの画面を表示するかを切り替える
import { useEffect, useState } from 'react';
import { PUZZLES } from './game/puzzles';
import { ClearScreen } from './screens/ClearScreen';
import { GameScreen } from './screens/GameScreen';
import { HowToScreen } from './screens/HowToScreen';
import { PuzzleListScreen } from './screens/PuzzleListScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TitleScreen } from './screens/TitleScreen';
import { ads } from './services/ads';
import { loadData, recordClear, resetAllData, saveData, type SaveData } from './services/storage';
import { setSoundEnabled } from './services/sound';

type Screen =
  | { name: 'title' }
  | { name: 'list' }
  | { name: 'game'; index: number; round: number }
  | { name: 'howto' }
  | { name: 'settings' };

interface ClearInfo {
  time: number;
  hintsUsed: number;
  isNewBest: boolean;
  previousBest: number | null;
}

export default function App() {
  const [data, setDataState] = useState<SaveData>(loadData);
  const [screen, setScreen] = useState<Screen>({ name: 'title' });
  const [clearInfo, setClearInfo] = useState<ClearInfo | null>(null);

  const setData = (d: SaveData) => {
    setDataState(d);
    saveData(d);
  };

  useEffect(() => setSoundEnabled(data.settings.sound), [data.settings.sound]);

  const clearedCount = PUZZLES.filter((p) => data.results[p.key!]).length;
  // まだクリアしていない最初の問題（全部クリア済みなら最後の問題）
  const firstUncleared = Math.max(0, PUZZLES.findIndex((p) => !data.results[p.key!]));
  const startIndex = clearedCount === PUZZLES.length ? PUZZLES.length - 1 : firstUncleared;

  const openGame = (index: number) => {
    setClearInfo(null);
    setScreen((s) => ({ name: 'game', index, round: s.name === 'game' ? s.round + 1 : 0 }));
  };

  switch (screen.name) {
    case 'title':
      return (
        <TitleScreen
          clearedCount={clearedCount}
          totalCount={PUZZLES.length}
          onStart={() => openGame(startIndex)}
          onSelect={() => setScreen({ name: 'list' })}
          onHowTo={() => setScreen({ name: 'howto' })}
          onSettings={() => setScreen({ name: 'settings' })}
        />
      );
    case 'list':
      return (
        <PuzzleListScreen
          puzzles={PUZZLES}
          results={data.results}
          onPick={openGame}
          onBack={() => setScreen({ name: 'title' })}
        />
      );
    case 'howto':
      return <HowToScreen onBack={() => setScreen({ name: 'title' })} />;
    case 'settings':
      return (
        <SettingsScreen
          settings={data.settings}
          onChange={(settings) => setData({ ...data, settings })}
          onResetData={() => setDataState(resetAllData())}
          onBack={() => setScreen({ name: 'title' })}
        />
      );
    case 'game': {
      const puzzle = PUZZLES[screen.index];
      const hasNext = screen.index < PUZZLES.length - 1;
      return (
        <>
          <GameScreen
            key={`${puzzle.key}-${screen.round}`}
            puzzle={puzzle}
            showTimer={data.settings.showTimer}
            onBack={() => setScreen({ name: 'list' })}
            onCleared={(time, hintsUsed) => {
              const r = recordClear(data, puzzle.key!, time, hintsUsed);
              setData(r.data);
              setClearInfo({ time, hintsUsed, isNewBest: r.isNewBest, previousBest: r.previousBest });
            }}
          />
          {clearInfo && (
            <ClearScreen
              puzzleId={puzzle.id}
              {...clearInfo}
              hasNext={hasNext}
              onNext={async () => {
                await ads.beforeNextPuzzle(data.totalClears); // 将来ここで数問ごとに広告
                openGame(screen.index + 1);
              }}
              onRetry={() => openGame(screen.index)}
              onList={() => {
                setClearInfo(null);
                setScreen({ name: 'list' });
              }}
            />
          )}
        </>
      );
    }
  }
}
