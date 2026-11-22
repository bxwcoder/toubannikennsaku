#!/usr/bin/env python3
"""
解析ツールの動作確認用に「作り物の音」を生成する。
※ 本物のジャグラーの音ではありません。プログラムが意図どおり動くかの確認専用です。
正解: 回転開始 12回 / ブドウ 3回 / チェリー 1回（隣の台の小さい電子音は数えないのが正解）
"""
import subprocess, sys
import numpy as np

SR = 44100
rng = np.random.default_rng(0)
dur = 60
x = rng.normal(0, 1, SR * dur)
# ホール雑音っぽいピンクノイズ
X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X[1:] /= np.sqrt(fr[1:]); x = np.fft.irfft(X)
x = x / np.abs(x).max() * 0.05

def add(sig, at):
    i = int(at * SR); x[i:i + len(sig)] += sig[:len(x) - i]

def reel_start():
    n = int(0.6 * SR); tt = np.arange(n) / SR
    burst = rng.normal(0, 1, n) * np.exp(-tt * 25) * 0.4              # ガシャッ
    hum = 0.08 * np.sin(2 * np.pi * 120 * tt) * (1 - np.exp(-tt * 10))  # モーター音
    return burst + hum

def beeps(n, hz, amp, gap=0.12, length=0.06):
    tt = np.arange(int(length * SR)) / SR
    b = amp * np.sin(2 * np.pi * hz * tt) * np.hanning(len(tt))
    out = np.zeros(int((gap * n + 0.2) * SR))
    for k in range(n):
        i = int(k * gap * SR); out[i:i + len(b)] += b
    return out

game_times = np.arange(1.0, 58, 4.6)[:12]
for gt in game_times:
    add(reel_start(), gt)
add(beeps(8, 2400, 0.3), game_times[1] + 2.5)   # ブドウ
add(beeps(8, 2400, 0.3), game_times[5] + 2.5)   # ブドウ
add(beeps(2, 2400, 0.3), game_times[7] + 2.5)   # チェリー
add(beeps(8, 2400, 0.3), game_times[10] + 2.5)  # ブドウ
add(beeps(8, 2600, 0.02), 20.0)                 # 隣の台（遠くて小さい）
x = np.clip(x, -1, 1)
out = sys.argv[1] if len(sys.argv) > 1 else "synthetic.wav"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", out],
               input=(x * 32767).astype(np.int16).tobytes(), check=True)
print("生成:", out)
