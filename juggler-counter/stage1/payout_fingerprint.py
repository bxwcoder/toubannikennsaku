#!/usr/bin/env python3
"""
第1段階（実録音版）：払い出し音の「指紋」照合テスト

考え方
  ・払い出し音は 5.5kHz 以上の高い音域に特徴がある（ホールのBGMはこの音域が弱い）。
  ・ユーザーが教えてくれたブドウの時刻（だいたいでOK）から、払い出し音の
    「指紋」（高音域の音の形）を自動で作る。
  ・録音全体で指紋とどれだけ似ているかを計算し、
    「似ている度合いが しきい値 以上の状態が 一定時間以上 続いた」ところを払い出しとみなす。
  ・続いた長さ（秒）で ブドウ（長い）とチェリー（短い）を区別できるかも確認する。

公平さのため「1回分を除いた残りで指紋を作り、除いた1回を見つけられるか」
（leave-one-out テスト）も行う。

使い方:
  python3 payout_fingerprint.py 録音.mp4 --grape 7 36 40 73 85 --cherry 93
"""
import argparse
import subprocess

import numpy as np
from scipy.signal import stft

SR = 44100
NFFT, HOP = 4096, 1024
FMIN, FMAX = 5500, 16000
WIN = 0.65  # 指紋を作る長さ（秒）


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "s16le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def features(x):
    f, t, Z = stft(x, fs=SR, nperseg=NFFT, noverlap=NFFT - HOP)
    d = 20 * np.log10(np.abs(Z) + 1e-10)
    m = (f >= FMIN) & (f <= FMAX)
    F = d[m] - np.median(d[m], axis=1, keepdims=True)  # 「いつもの音」を引く
    G = F - F.mean(0)
    G /= np.linalg.norm(G, axis=0) + 1e-9
    return t, F, G


def window_profile(t, F, start):
    i = (t >= start) & (t <= start + WIN)
    return F[:, i].mean(1)


def similarity(G, template):
    v = template - template.mean()
    v /= np.linalg.norm(v) + 1e-9
    return np.convolve(v @ G, np.ones(3) / 3, "same")


def refine_starts(t, F, G, rough, search=1.5, iters=4):
    """だいたいの時刻から、払い出し音の正確な開始時刻を自動で合わせる"""
    starts = list(rough)
    for _ in range(iters):
        tmpl = np.mean([window_profile(t, F, s) for s in starts], 0)
        s_curve = similarity(G, tmpl)
        new = []
        for r in rough:
            i = np.where((t >= r - search) & (t <= r + search))[0]
            # WIN 区間の平均類似度が最大になる開始点
            n = max(1, int(WIN * SR / HOP))
            avg = np.convolve(s_curve, np.ones(n) / n, "valid")
            i = i[i < len(avg)]
            best = i[np.argmax(avg[i])]
            new.append(float(t[best]))
        starts = new
    return starts


def runs_above(t, s, th, min_len):
    dt = HOP / SR
    on = s > th
    out, i = [], 0
    while i < len(on):
        if on[i]:
            j = i
            while j + 1 < len(on) and on[j + 1]:
                j += 1
            length = (j - i + 1) * dt
            if length >= min_len:
                out.append((float(t[i]), length, float(s[i:j + 1].max())))
            i = j + 1
        else:
            i += 1
    return out


def near(a, labels, tol=1.5):
    return any(abs(a - b) <= tol for b in labels)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("audio")
    p.add_argument("--grape", type=float, nargs="+", required=True, help="ブドウの時刻（秒）")
    p.add_argument("--cherry", type=float, nargs="*", default=[], help="チェリーの時刻（秒）")
    p.add_argument("--th", type=float, default=0.45, help="似ている度合いのしきい値")
    p.add_argument("--min-len", type=float, default=0.08, help="候補として拾う最短の長さ（秒）")
    p.add_argument("--grape-len", type=float, default=0.4, help="これ以上続けばブドウ（秒）")
    p.add_argument("--save-template")
    a = p.parse_args()

    x = load(a.audio)
    t, F, G = features(x)
    starts = refine_starts(t, F, G, a.grape)
    print("ブドウ払い出し音の開始時刻（自動補正後）:", ", ".join(f"{s:.2f}" for s in starts))

    # ---- leave-one-out テスト ----
    print("\n[テスト1] 1回分を除いた指紋で、除いた1回を見つけられるか")
    ok = 0
    for k, s0 in enumerate(starts):
        tmpl = np.mean([window_profile(t, F, s) for j, s in enumerate(starts) if j != k], 0)
        runs = runs_above(t, similarity(G, tmpl), a.th, a.min_len)
        hit = [r for r in runs if abs(r[0] - s0) < 1.0 and r[1] >= a.grape_len]
        false_g = [r for r in runs if r[1] >= a.grape_len and not near(r[0], a.grape + a.cherry)]
        ok += bool(hit)
        print(f"  ブドウ#{k + 1}({s0:6.2f}秒): {'検出' if hit else '見逃し'}"
              f"{f'（長さ{hit[0][1]:.2f}秒）' if hit else ''}  / 他の場所でのブドウ誤検出: {len(false_g)}件")
    print(f"  → {ok}/{len(starts)} 回 検出")

    # ---- 全ブドウで作った指紋で録音全体を判定 ----
    tmpl = np.mean([window_profile(t, F, s) for s in starts], 0)
    if a.save_template:
        np.save(a.save_template, tmpl)
    runs = runs_above(t, similarity(G, tmpl), a.th, a.min_len)
    print(f"\n[テスト2] 全ブドウの指紋で録音全体を判定（しきい値{a.th}）")
    print("  時刻     長さ    最大類似度  判定        正解")
    for st, ln, mx in runs:
        kind = "ブドウ" if ln >= a.grape_len else "短い音(チェリー?)"
        truth = "ブドウ" if near(st, a.grape) else ("チェリー" if near(st, a.cherry) else "-")
        print(f"  {st:6.2f}  {ln:5.2f}秒  {mx:5.2f}      {kind:10s}  {truth}")


if __name__ == "__main__":
    main()
