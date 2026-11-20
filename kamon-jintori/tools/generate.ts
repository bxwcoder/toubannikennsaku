// 問題集を作る道具（パソコンで実行する）
// 使い方: npm run generate -- 6
//   → src/game/data/puzzles-6x6.json に問題集を保存する
//
// 1問ずつ、次のチェックをすべて通ったものだけを収録する:
//   ・解答がちょうど1通り（0通り・2通り以上は捨てる）
//   ・エリアの数が正しく、各エリアがつながっている
//   ・当てずっぽうなしの推理だけで解ける
//   ・すでに収録した問題と同じではない
import { writeFileSync } from 'node:fs';
import { generatePuzzle } from '../src/game/generator';
import { countSolutions, validatePuzzle } from '../src/game/solver';
import { solveByLogic } from '../src/game/logic';
import type { PuzzleRecord } from '../src/game/puzzles';

const size = Number(process.argv[2] ?? 6);
// 難易度（★の数）ごとに何問集めるか。盤面サイズごとに調整できる
const QUOTA: Record<number, Record<number, number>> = {
  6: { 1: 8, 2: 14, 3: 8 },
  8: { 1: 5, 2: 15, 3: 10 },
  10: { 1: 3, 2: 12, 3: 15 },
};
const quota = QUOTA[size];
if (!quota) throw new Error(`盤面サイズ ${size} の設定がありません`);

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const picked: Record<number, (PuzzleRecord & { score: number })[]> = { 1: [], 2: [], 3: [] };
const seen = new Set<string>();
const stats = { tried: 0, failed: 0, notUnique: 0, notLogical: 0, duplicate: 0, full: 0 };
const startedAt = Date.now();

for (let seed = 1; seed <= 200000; seed++) {
  if ([1, 2, 3].every((t) => picked[t].length >= quota[t])) break;
  stats.tried++;
  const g = generatePuzzle(size, seed * 1000 + size);
  if (!g) { stats.failed++; continue; }

  const puzzle = { ...g, id: 0, technique: 0 };
  // 解答数のチェック（打ち切りなしで全部数える）
  if (countSolutions(size, g.regions, Infinity) !== 1 || validatePuzzle(puzzle).length > 0) {
    stats.notUnique++;
    continue;
  }
  const logic = solveByLogic(puzzle);
  if (!logic.solved) { stats.notLogical++; continue; }

  const key = g.regions.join(',');
  if (seen.has(key)) { stats.duplicate++; continue; }
  const t = logic.maxTechnique;
  if (picked[t].length >= quota[t]) { stats.full++; continue; }
  seen.add(key);
  picked[t].push({
    seed,
    regions: g.regions.map((r) => LETTERS[r]).join(''),
    solution: g.solution.join(','),
    technique: t,
    score: logic.score,
  });
}

// 易しい順に並べる（★が少ない順 → 同じ★なら推理の手数が少ない順）
const all = [1, 2, 3].flatMap((t) => picked[t].sort((a, b) => a.score - b.score));
const out = `src/game/data/puzzles-${size}x${size}.json`;
writeFileSync(out, JSON.stringify(all, null, 1) + '\n');

console.log(`${size}×${size}: ${all.length}問を ${out} に保存しました（${((Date.now() - startedAt) / 1000).toFixed(1)}秒）`);
console.log(`  ★1: ${picked[1].length}問 / ★2: ${picked[2].length}問 / ★3: ${picked[3].length}問`);
console.log(`  試した数 ${stats.tried}、捨てた内訳: 生成失敗 ${stats.failed}、解答が1通りでない ${stats.notUnique}、推理で解けない ${stats.notLogical}、重複 ${stats.duplicate}、その★は満員 ${stats.full}`);
const missing = [1, 2, 3].filter((t) => picked[t].length < quota[t]);
if (missing.length) console.log(`  ※ 目標数に届かなかった難易度: ★${missing.join(', ★')}`);
