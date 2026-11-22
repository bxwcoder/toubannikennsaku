#!/usr/bin/env python3
"""
第1段階（実録音版）：リール回転開始音の照合テスト

考え方
  ・リール回転開始時に台が鳴らす音は、毎回ほぼ同じ「デジタル音」なので、
    お手本の音（短く切り取ったもの）と波形がそっくりな場所を探せば見つかる。
  ・そっくり度（-1〜1）が しきい値 以上の山を「回転開始」とする。
  ・一度数えたら一定時間（初期値3秒）は数えない → 二重カウント防止。
    （ジャグラーは1ゲーム最低約4.1秒）

使い方:
  python3 game_start_match.py お手本.mp4 録音.mp4 [--th 0.6] [--answer 23]
"""
import argparse
import subprocess

import numpy as np
from scipy.signal import fftconvolve, find_peaks

SR = 44100


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "s16le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


def match_curve(x, tmpl):
    """録音の各時点で、お手本とのそっくり度（正規化相互相関）を計算する"""
    c = tmpl - tmpl.mean()
    r = fftconvolve(x, c[::-1], "valid")
    energy = np.sqrt(np.maximum(fftconvolve(x ** 2, np.ones(len(c)), "valid"), 0)) + 1e-9
    return r / (energy * np.linalg.norm(c))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("template")
    p.add_argument("audio")
    p.add_argument("--th", type=float, default=0.6, help="そっくり度のしきい値")
    p.add_argument("--refractory", type=float, default=3.0, help="二重カウント防止の時間（秒）")
    p.add_argument("--answer", type=int, help="正解のゲーム数（分かれば）")
    a = p.parse_args()

    tmpl = load(a.template)
    x = load(a.audio)
    s = match_curve(x, tmpl)

    # 判定に関係なく、似ている山を全部出して「余裕」を確認する
    pk, _ = find_peaks(s, height=0.1, distance=int(1.0 * SR))
    hits = [k for k in pk if s[k] >= a.th]
    # 二重カウント防止
    starts, last = [], -1e9
    for k in hits:
        if (k - last) / SR >= a.refractory:
            starts.append(k)
            last = k

    print(f"お手本の長さ: {len(tmpl) / SR:.2f}秒 / 録音の長さ: {len(x) / SR:.1f}秒")
    print(f"回転開始として数えた回数: {len(starts)} 回（しきい値 {a.th}）")
    if a.answer is not None:
        print(f"正解: {a.answer} 回 → {'一致' if len(starts) == a.answer else '不一致'}")
    print("\n時刻(秒)  そっくり度  前回との間隔")
    prev = None
    for k in starts:
        t = k / SR
        print(f"  {t:7.2f}    {s[k]:.2f}      {'' if prev is None else f'{t - prev:.2f}秒'}")
        prev = t
    others = [s[k] for k in pk if k not in starts]
    if starts and others:
        print(f"\n数えた音のそっくり度: 最低 {min(s[k] for k in starts):.2f}")
        print(f"数えなかった音のそっくり度: 最高 {max(others):.2f}")
        print("（この2つの差が大きいほど、誤検出・見逃しが起きにくい）")


if __name__ == "__main__":
    main()
