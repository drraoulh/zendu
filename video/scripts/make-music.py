"""Musique de fond originale de la vidéo de lancement (composée par programme, libre de droits).

Ambiance chaleureuse et légèrement afro : marimba en arpèges, nappe douce, basse ronde,
grosse caisse feutrée et shaker. 100 BPM, progression I–V–vi–IV en la majeur.
Usage : python3 make-music.py <sortie.wav> <durée en secondes>
"""
import sys
import wave

import numpy as np

SR = 44100
OUT = sys.argv[1]
DURATION = float(sys.argv[2]) if len(sys.argv) > 2 else 50.0
BPM = 100
BEAT = 60 / BPM
N = int(SR * DURATION)
rng = np.random.default_rng(7)

mix_l = np.zeros(N)
mix_r = np.zeros(N)


def note_freq(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(sig, start_s, gain=1.0, pan=0.0):
    i = int(start_s * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    mix_l[i : i + len(sig)] += sig * gain * (1 - max(pan, 0))
    mix_r[i : i + len(sig)] += sig * gain * (1 + min(pan, 0))


def env(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def marimba(midi, length=0.9):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = note_freq(midi)
    tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 18)
    return tone * env(n, 0.003, 0.28)


def pad(midis, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in midis:
        f = note_freq(m)
        for detune in (-0.12, 0.0, 0.12):
            s += np.sin(2 * np.pi * f * (1 + detune / 100) * t + rng.uniform(0, 6.28))
    fade = np.minimum(1, np.minimum(t / 0.8, (length - t) / 0.8))
    return s / (len(midis) * 3) * np.clip(fade, 0, 1)


def bass(midi, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = note_freq(midi)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env(n, 0.01, 0.45)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 95 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def shaker():
    n = int(0.07 * SR)
    noise = rng.standard_normal(n)
    hp = noise - np.concatenate([[0], noise[:-1]])
    return hp * env(n, 0.002, 0.02)


# Progression (racines en la majeur) : A – E – F#m – D, une mesure (4 temps) chacune.
CHORDS = [
    (57, [69, 73, 76]),  # A
    (52, [68, 71, 76]),  # E
    (54, [69, 73, 78]),  # F#m
    (50, [69, 74, 78]),  # D
]
ARP = [0, 1, 2, 1, 2, 0, 1, 2]  # croches

bar = 4 * BEAT
t0 = 0.0
b = 0
while t0 < DURATION:
    root, tones = CHORDS[b % 4]
    intro = b < 2  # deux premières mesures plus légères
    add(pad(tones, bar + 0.6), t0, 0.16)
    add(bass(root - 12, BEAT * 1.6), t0, 0.0 if intro else 0.32)
    add(bass(root - 12, BEAT * 1.2), t0 + 2.5 * BEAT, 0.0 if intro else 0.22)
    for k, idx in enumerate(ARP):
        midi = tones[idx] + (12 if (b % 2 and k in (3, 7)) else 0)
        add(marimba(midi), t0 + k * BEAT / 2, 0.20 if not intro else 0.14, pan=(-0.3 if k % 2 else 0.3))
    if not intro:
        for beat in range(4):
            add(kick(), t0 + beat * BEAT, 0.42 if beat in (0, 2) else 0.18)
        for s16 in range(16):
            add(shaker(), t0 + s16 * BEAT / 4, 0.05 if s16 % 2 else 0.09, pan=0.2)
    t0 += bar
    b += 1

# Fondu d'entrée et de sortie, normalisation douce.
t = np.arange(N) / SR
fade = np.clip(np.minimum(t / 1.5, (DURATION - t) / 3.0), 0, 1)
stereo = np.stack([mix_l, mix_r], axis=1) * fade[:, None]
stereo = np.tanh(stereo * 1.2)
stereo /= np.max(np.abs(stereo)) + 1e-9
stereo *= 0.89

with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("musique", OUT, DURATION, "s")
