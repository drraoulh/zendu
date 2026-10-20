import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "./theme";
import type { Word } from "./copy";

/** Fond graphite du site, avec un halo bleu qui dérive lentement. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 1500], [70, 30]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(60% 40% at ${x}% 8%, rgba(11,77,255,0.28), transparent 70%), radial-gradient(50% 35% at 10% 95%, rgba(63,160,255,0.14), transparent 70%), linear-gradient(180deg, ${C.graphite} 0%, ${C.black} 100%)`,
      }}
    />
  );
};

/** Apparition douce (montée + fondu), décalée de `delay` images. */
export const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties; distance?: number }> = ({
  delay = 0,
  children,
  style,
  distance = 40,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 18 });
  return <div style={{ opacity: p, translate: `0 ${(1 - p) * distance}px`, ...style }}>{children}</div>;
};

/** Titre de scène, en haut de l'image. */
export const Title: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <Rise delay={delay} style={{ position: "absolute", top: 120, left: 80, right: 80, textAlign: "center" }}>
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 66, lineHeight: 1.08, letterSpacing: -1.8, color: C.white }}>{children}</div>
  </Rise>
);

/** Pastille d'information (bleu de la marque). */
export const Badge: React.FC<{ children: React.ReactNode; delay?: number; top: number }> = ({ children, delay = 0, top }) => (
  <Rise delay={delay} style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: 44,
        color: C.white,
        background: C.brand,
        borderRadius: 999,
        padding: "18px 40px",
        boxShadow: "0 18px 40px -12px rgba(11,77,255,0.7)",
      }}
    >
      {children}
    </div>
  </Rise>
);

/**
 * Téléphone avec une ou plusieurs captures de l'appli. `shots` : [image, image de départ (s)],
 * changement en fondu enchaîné. Le temps est relatif au début de la scène.
 */
export const Phone: React.FC<{ shots: [string, number][]; top?: number; width?: number; enterDelay?: number; scrollLast?: number }> = ({
  shots,
  top = 450,
  width = 520,
  enterDelay = 0,
  scrollLast = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = spring({ frame: frame - enterDelay, fps, config: { damping: 200 }, durationInFrames: 24 });
  const height = (width * 2532) / 1170;
  const bezel = 22;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: (1080 - width - bezel * 2) / 2,
        width: width + bezel * 2,
        height: height + bezel * 2,
        borderRadius: 96,
        background: "#0a0a0b",
        boxShadow: "0 60px 120px -40px rgba(0,0,0,0.9), 0 0 0 3px #2a2b30, inset 0 0 0 2px #3a3b40",
        opacity: enter,
        translate: `0 ${(1 - enter) * 160}px`,
        scale: String(0.94 + enter * 0.06),
      }}
    >
      <div style={{ position: "absolute", inset: bezel, borderRadius: 76, overflow: "hidden", background: C.bg }}>
        {shots.map(([src, start], i) => {
          const next = shots[i + 1]?.[1];
          const fadeIn = i === 0 ? 1 : interpolate(t, [start, start + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const visible = next === undefined || t < next + 0.35;
          const isLast = i === shots.length - 1;
          const scroll = isLast && scrollLast
            ? interpolate(t, [start + 0.6, start + 3.2], [0, scrollLast], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) })
            : 0;
          return visible ? (
            <Img key={src} src={staticFile(src)} style={{ position: "absolute", top: 64 - scroll, left: 0, width: "100%", opacity: fadeIn }} />
          ) : null;
        })}
        {/* Encoche de l'écran */}
        <div style={{ position: "absolute", top: 18, left: "50%", translate: "-50% 0", width: 170, height: 46, borderRadius: 30, background: "#0a0a0b" }} />
      </div>
    </div>
  );
};

/** Sous-titres synchronisés sur la voix off, mot courant en bleu ciel. */
export const Captions: React.FC<{ words: Word[]; offset: number }> = ({ words, offset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + offset;
  // Groupes de mots : coupés à la ponctuation ou tous les 6 mots.
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[.,:;!?]$/.test(w.text) || cur.length >= 6) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  const g = groups.find((gr, i) => t >= gr[0].start - 0.05 && t < (groups[i + 1]?.[0].start ?? gr[gr.length - 1].end + 0.6));
  if (!g) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 120, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.25,
          textAlign: "center",
          color: C.white,
          background: "rgba(0,0,0,0.55)",
          borderRadius: 28,
          padding: "18px 30px",
        }}
      >
        {g.map((w, i) => (
          <span key={i} style={{ color: t >= w.start && t <= w.end + 0.15 ? C.sky : C.white }}>
            {w.text.replace(/^:$/, ":")}
            {i < g.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Logo: React.FC<{ width: number; style?: React.CSSProperties }> = ({ width, style }) => (
  <Img src={staticFile("brand/logo-horizontal-negative.svg")} style={{ width, ...style }} />
);
