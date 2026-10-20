import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Captions } from "./components";
import { COPY, FPS, type Lang } from "./copy";
import { AmountScene, EndScene, HookScene, IntroScene, PayScene, RecipientScene, TrackScene, TrustScene } from "./scenes";

/**
 * Vidéo de lancement WorldSoft Transfer (9:16). Chaque scène commence au mot de la voix off qui
 * l'annonce ; la musique de fond (originale) est baissée sous la voix puis remonte sur le carton de fin.
 */
export const Launch: React.FC<{ lang: Lang }> = ({ lang }) => {
  const copy = COPY[lang];
  const { durationInFrames } = useVideoConfig();
  const f = (s: number) => Math.round(s * FPS);
  const starts = copy.scenes.map(f);
  const ends = [...starts.slice(1), durationInFrames];
  const len = (i: number) => ends[i] - starts[i];
  const local = (i: number, s: number) => s - copy.scenes[i];
  const scenes = [
    <HookScene key="hook" copy={copy} lang={lang} />,
    <IntroScene key="intro" copy={copy} lang={lang} />,
    <AmountScene key="amount" copy={copy} lang={lang} receiveAt={local(2, copy.cues.receive)} />,
    <RecipientScene key="recipient" copy={copy} lang={lang} />,
    <PayScene key="pay" copy={copy} lang={lang} interacAt={local(4, copy.cues.interac)} />,
    <TrackScene key="track" copy={copy} lang={lang} notifAt={local(5, copy.cues.notification)} receiptAt={local(5, copy.cues.receipt)} />,
    <TrustScene key="trust" copy={copy} lang={lang} />,
    <EndScene key="end" copy={copy} lang={lang} />,
  ];
  const names = ["Accroche", "Marque", "Montant", "Destinataire", "Paiement", "Suivi", "Confiance", "Fin"];
  const voiceEndFrame = f(copy.voiceEnd);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Backdrop />
      {scenes.map((node, i) => (
        <Sequence key={i} name={names[i]} from={starts[i]} durationInFrames={len(i)} premountFor={30}>
          <SceneFade length={len(i)}>{node}</SceneFade>
        </Sequence>
      ))}
      {/* Sous-titres sur toute la durée de la voix, sauf sur l'accroche et le carton de fin (déjà écrits en grand). */}
      <Sequence name="Sous-titres" from={starts[1]} durationInFrames={starts[7] - starts[1]}>
        <Captions words={copy.words} offset={copy.scenes[1]} />
      </Sequence>
      <Audio src={staticFile(`audio/vo-${lang}.mp3`)} />
      <Audio
        src={staticFile("audio/music.mp3")}
        volume={(fr) =>
          interpolate(fr, [0, 15, voiceEndFrame - 10, voiceEndFrame + 10, durationInFrames - 30, durationInFrames], [0, 0.16, 0.16, 0.42, 0.42, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};

/** Fondu enchaîné court entre les scènes. */
const SceneFade: React.FC<{ length: number; children: React.ReactNode }> = ({ length, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8, length - 8, length], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
