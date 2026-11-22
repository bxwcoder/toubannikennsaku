#!/usr/bin/env python3
"""
第1段階（実録音版）：ゲーム数・ブドウ・チェリーをまとめて数える試作

仕組み
  1. ゲーム数：リール回転開始音のお手本と波形がそっくりな場所を数える
     （しきい値以上・一度数えたら3秒は数えない）
  2. 払い出し：払い出し音の「出だし」のお手本と波形がそっくりな場所を探す
     ※ チェリーの払い出し音は、ブドウの払い出し音の出だしと同じ種類の音で、長さだけが違う
  3. 払い出し音が何秒続いたか（高い音域の音量で測る）で区別する
       長い（初期値 0.55秒以上）→ ブドウ / 短い → チェリー

使い方:
  python3 count_all.py 録音.mp4 --reel 回転開始音.mp4 --payout 払い出し音の出だし.mp4
"""
import argparse

import numpy as np
from scipy.signal import butter, find_peaks, sosfiltfilt

from game_start_match import SR, load, match_curve


def pick(s, th, refractory):
    pk, _ = find_peaks(s, height=th, distance=int(0.5 * SR))
    out, last = [], -1e9
    for k in pk:
        if (k - last) / SR >= refractory:
            out.append(k)
            last = k
    return out


def high_band_envelope(x, step=0.01):
    """6〜15kHz（払い出し音の特徴がある音域）の音量を 0.01秒ごとに求める"""
    sos = butter(6, [6000, 15000], "bandpass", fs=SR, output="sos")
    y = sosfiltfilt(sos, x)
    n = int(SR * step)
    env = np.sqrt(np.convolve(y ** 2, np.ones(n) / n, "same"))[::n]
    env = 20 * np.log10(env + 1e-9)
    return np.convolve(env, np.ones(3) / 3, "same")


def payout_length(env, t0, step=0.01):
    """払い出し音が鳴り始めてから、高い音域の音量が下がるまでの秒数"""
    i0 = int(t0 / step)
    before = np.median(env[max(0, i0 - 30):max(1, i0 - 5)])
    during = np.median(env[i0 + 5:i0 + 20])
    th = (before + during) / 2
    i, quiet = i0 + 5, 0
    while i < len(env) and quiet < 6:  # 0.06秒続けて静かになったら終わり
        quiet = quiet + 1 if env[i] < th else 0
        i += 1
    return (i - 6 - i0) * step


def main():
    p = argparse.ArgumentParser()
    p.add_argument("audio")
    p.add_argument("--reel", required=True, help="リール回転開始音のお手本")
    p.add_argument("--payout", required=True, help="払い出し音の出だしのお手本")
    p.add_argument("--reel-th", type=float, default=0.6)
    p.add_argument("--payout-th", type=float, default=0.55)
    p.add_argument("--grape-len", type=float, default=0.55, help="これ以上続けばブドウ（秒）")
    a = p.parse_args()

    x = load(a.audio)
    games = pick(match_curve(x, load(a.reel)), a.reel_th, 3.0)
    s_pay = match_curve(x, load(a.payout))
    pays = pick(s_pay, a.payout_th, 2.0)
    env = high_band_envelope(x)

    grapes, cherries = [], []
    print("払い出しの判定")
    for k in pays:
        t = k / SR
        ln = payout_length(env, t)
        kind = "ブドウ" if ln >= a.grape_len else "チェリー"
        (grapes if kind == "ブドウ" else cherries).append(t)
        print(f"  {t:7.2f}秒  そっくり度{s_pay[k]:.2f}  長さ{ln:.2f}秒 → {kind}")

    g = len(games)
    print("\n===== 集計 =====")
    print(f"ゲーム数 : {g}")
    print(f"ブドウ   : {len(grapes)} 回" + (f"  確率 1/{g / len(grapes):.2f}" if grapes else ""))
    print(f"チェリー : {len(cherries)} 回" + (f"  確率 1/{g / len(cherries):.2f}" if cherries else ""))


if __name__ == "__main__":
    main()
