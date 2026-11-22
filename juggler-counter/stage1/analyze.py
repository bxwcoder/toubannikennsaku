#!/usr/bin/env python3
"""
第1段階：ジャグラー録音の解析ツール（実験用）

録音ファイル（wav / m4a / mp3 など）を読み込み、
  1. 音の「絵」（スペクトログラム）を画像で保存する
  2. 「ピッ」という短い電子音（払い出し時のクレジット加算音の候補）を探し、
     まとまり（バースト）ごとに何回鳴ったかを数える
  3. 急に大きな音が立ち上がる瞬間（リール回転開始音の候補）を探す
を行います。

※ 判定ルールは「仮説」です。実際のジャグラーの録音で確かめるまで正しいとは言えません。

使い方:
  python3 analyze.py 録音ファイル [--start 秒] [--end 秒] [--out 出力フォルダ]
"""
import argparse
import csv
import os
import subprocess
import sys

import numpy as np
from scipy.signal import stft

SR = 44100  # 解析に使うサンプリング周波数


def load_audio(path, start=None, end=None):
    """ffmpeg で読み込み、モノラル・44.1kHz の数値列にする"""
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", str(start)]
    cmd += ["-i", path]
    if end is not None:
        cmd += ["-t", str(end - (start or 0))]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def analyze(x, params):
    n_fft, hop = 2048, 512
    f, t, Z = stft(x, fs=SR, nperseg=n_fft, noverlap=n_fft - hop, boundary=None)
    mag = np.abs(Z) + 1e-10
    db = 20 * np.log10(mag)

    # ---- (A) 電子音（ピッ）候補：特定の高さだけ飛び抜けて強いフレーム ----
    band = (f >= params.beep_fmin) & (f <= params.beep_fmax)
    fb = f[band]
    dbb = db[band]
    peak_idx = dbb.argmax(axis=0)
    peak_db = dbb.max(axis=0)
    median_db = np.median(dbb, axis=0)
    tonality = peak_db - median_db            # 周りより何dB飛び抜けているか
    peak_hz = fb[peak_idx]
    # 全体の音量の基準（録音全体の中央値）からの大きさ
    loud = peak_db - np.median(peak_db)
    is_beep = (tonality > params.tonality_db) & (loud > params.beep_loud_db)

    beeps = []  # (開始秒, 終了秒, 周波数Hz, 強さdB)
    i = 0
    while i < len(t):
        if is_beep[i]:
            j = i
            while j + 1 < len(t) and is_beep[j + 1] and abs(peak_hz[j + 1] - peak_hz[i]) < 150:
                j += 1
            dur = t[j] - t[i] + hop / SR
            if params.beep_min_ms / 1000 <= dur <= params.beep_max_ms / 1000:
                beeps.append((t[i], t[j] + hop / SR, float(np.median(peak_hz[i:j + 1])),
                              float(peak_db[i:j + 1].max())))
            i = j + 1
        else:
            i += 1

    # 近い電子音をまとめて「1回の払い出し」とみなす
    bursts = []
    for b in beeps:
        if bursts and b[0] - bursts[-1]["end"] < params.burst_gap and \
                abs(b[2] - bursts[-1]["hz"]) < 300:
            bursts[-1]["end"] = b[1]
            bursts[-1]["count"] += 1
            bursts[-1]["level"] = max(bursts[-1]["level"], b[3])
        else:
            bursts.append({"start": b[0], "end": b[1], "hz": b[2], "count": 1, "level": b[3]})

    # 隣の台対策：一番大きいまとまりより大幅に小さい音は「遠くの台」とみなす
    if bursts:
        ref = max(x["level"] for x in bursts)
        for x in bursts:
            x["far"] = x["level"] < ref - params.own_margin_db

    # ---- (B) リール回転開始音候補：音のエネルギーが急に増える瞬間 ----
    lowmid = (f >= 80) & (f <= 6000)
    flux = np.maximum(np.diff(db[lowmid], axis=1), 0).mean(axis=0)
    flux = np.concatenate([[0], flux])
    thr = np.median(flux) + params.onset_k * (np.percentile(flux, 90) - np.median(flux))
    onsets = []
    last = -1e9
    for k in np.where(flux > thr)[0]:
        # 二重カウント防止：一度検出したら一定時間は検出しない
        if t[k] - last >= params.game_refractory:
            # 電子音の最中は除外
            if not any(b[0] - 0.05 <= t[k] <= b[1] + 0.05 for b in beeps):
                onsets.append(float(t[k]))
                last = t[k]

    return dict(f=f, t=t, db=db, beeps=beeps, bursts=bursts, onsets=onsets,
                flux=flux, flux_thr=thr)


def classify(burst, params):
    if burst.get("far"):
        return "隣の台?"
    n = burst["count"]
    if params.grape_min <= n <= params.grape_max:
        return "ブドウ候補"
    if params.cherry_min <= n <= params.cherry_max:
        return "チェリー候補"
    return "その他"


def save_plot(res, path, offset, title):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    f, t, db = res["f"], res["t"] + offset, res["db"]
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(max(10, (t[-1] - t[0]) / 3), 7),
                                   sharex=True, gridspec_kw={"height_ratios": [3, 1]})
    vmax = np.percentile(db, 99.5)
    ax1.pcolormesh(t, f / 1000, db, shading="auto", vmin=vmax - 70, vmax=vmax, cmap="magma")
    ax1.set_ylim(0, 10)
    ax1.set_ylabel("kHz")
    ax1.set_title(title)
    for b in res["bursts"]:
        ax1.axvspan(b["start"] + offset, b["end"] + offset, color="cyan", alpha=0.25)
        ax1.text(b["start"] + offset, 9.3, f'{b["count"]}', color="cyan", fontsize=9)
    for o in res["onsets"]:
        ax1.axvline(o + offset, color="lime", lw=0.8, alpha=0.8)
    ax2.plot(t, res["flux"], lw=0.6)
    ax2.axhline(res["flux_thr"], color="r", lw=0.6)
    ax2.set_xlabel("sec")
    ax2.set_ylabel("onset")
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("audio")
    p.add_argument("--start", type=float)
    p.add_argument("--end", type=float)
    p.add_argument("--out", default="out")
    # 調整用パラメータ（実録音を見て決める）
    p.add_argument("--beep-fmin", type=float, default=1000)
    p.add_argument("--beep-fmax", type=float, default=8000)
    p.add_argument("--tonality-db", type=float, default=25)
    p.add_argument("--beep-loud-db", type=float, default=15)
    p.add_argument("--beep-min-ms", type=float, default=25)
    p.add_argument("--beep-max-ms", type=float, default=250)
    p.add_argument("--own-margin-db", type=float, default=12,
                   help="一番大きい電子音よりこれ以上小さい音は隣の台とみなす")
    p.add_argument("--burst-gap", type=float, default=0.35)
    p.add_argument("--onset-k", type=float, default=4.0)
    p.add_argument("--game-refractory", type=float, default=3.0,
                   help="1ゲームの最短間隔（秒）。ジャグラーは約4.1秒のウェイトがある")
    p.add_argument("--grape-min", type=int, default=6)
    p.add_argument("--grape-max", type=int, default=9)
    p.add_argument("--cherry-min", type=int, default=1)
    p.add_argument("--cherry-max", type=int, default=4)
    a = p.parse_args()

    os.makedirs(a.out, exist_ok=True)
    x = load_audio(a.audio, a.start, a.end)
    if len(x) < SR:
        sys.exit("音声が短すぎます")
    res = analyze(x, a)
    off = a.start or 0
    name = os.path.splitext(os.path.basename(a.audio))[0]

    with open(os.path.join(a.out, f"{name}_events.csv"), "w", newline="", encoding="utf-8") as fp:
        w = csv.writer(fp)
        w.writerow(["種類", "時刻(秒)", "電子音の回数", "高さ(Hz)", "判定"])
        for o in res["onsets"]:
            w.writerow(["回転開始候補", f"{o + off:.2f}", "", "", ""])
        for b in res["bursts"]:
            w.writerow(["電子音のまとまり", f'{b["start"] + off:.2f}', b["count"],
                        f'{b["hz"]:.0f}', classify(b, a)])

    save_plot(res, os.path.join(a.out, f"{name}.png"), off, name)

    kinds = [classify(b, a) for b in res["bursts"]]
    g = len(res["onsets"])
    print(f"解析範囲: {off:.1f}秒 〜 {off + len(x) / SR:.1f}秒")
    print(f"回転開始候補: {g} 回")
    print(f"ブドウ候補: {kinds.count('ブドウ候補')} 回 / チェリー候補: {kinds.count('チェリー候補')} 回"
          f" / その他: {kinds.count('その他')} 回 / 隣の台?: {kinds.count('隣の台?')} 回")
    for b, k in zip(res["bursts"], kinds):
        print(f'  {b["start"] + off:7.2f}秒  電子音{b["count"]:2d}回  {b["hz"]:5.0f}Hz  {b["level"]:5.1f}dB  → {k}')
    print(f"画像と一覧を {a.out}/ に保存しました")


if __name__ == "__main__":
    main()
