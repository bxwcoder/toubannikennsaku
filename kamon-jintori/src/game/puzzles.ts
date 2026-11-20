// 検証済みの問題データ（STEP 2 用の少数の問題）
// regions: 左上から行ごとにエリアを A〜F の文字で表したもの
// solution: 各行の家紋の列番号（0始まり）
// すべての問題は puzzles.test.ts で「解答がちょうど1通り」であることを確認している
import type { Puzzle } from './types';

const RAW: { regions: string; solution: string; technique: number }[] = [
  { regions: 'BBBBACBDCBBCDDCCCCDDCCEEDFCCEEDFFFEE', solution: '403152', technique: 1 },
  { regions: 'DAACCCDAEBCCDEEEECDEEEEEEEEFFEEEFFFE', solution: '135024', technique: 1 },
  { regions: 'BAAACCBBBAACDCCCCCDCCCCECCFFCECFFFFF', solution: '314052', technique: 2 },
  { regions: 'EEBBBAEBBBCAEEECCAEDDFCCEEEFFCFFFFFF', solution: '514203', technique: 2 },
  { regions: 'AAABBBDDAABBDDDCCCDEEECCDEEECCDDEEFF', solution: '153024', technique: 3 },
  { regions: 'BBAAACBAACCCCCACDCECCCDDEECCFDEEECFF', solution: '203514', technique: 3 },
];

export const PUZZLES: Puzzle[] = RAW.map((r, idx) => ({
  id: idx + 1,
  size: Math.round(Math.sqrt(r.regions.length)),
  regions: [...r.regions].map((ch) => ch.charCodeAt(0) - 65),
  solution: [...r.solution].map(Number),
  technique: r.technique,
}));
