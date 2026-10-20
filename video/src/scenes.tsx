import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Badge, Logo, Phone, Rise, Title } from "./components";
import type { Copy, Lang } from "./copy";
import { C, FONT } from "./theme";

type SceneProps = { copy: Copy; lang: Lang };

/** 1. Accroche : la phrase apparaît morceau par morceau, puis les trois pays. */
export const HookScene: React.FC<SceneProps> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 90 }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 112, lineHeight: 1.04, letterSpacing: -3.4, color: C.white, textAlign: "center" }}>
        {copy.hook.map((part, i) => {
          const p = spring({ frame: frame - i * 9, fps, config: { damping: 200 }, durationInFrames: 16 });
          const last = i === copy.hook.length - 1;
          return (
            <div key={i} style={{ opacity: p, translate: `0 ${(1 - p) * 50}px`, color: last ? C.sky : C.white }}>
              {part}
            </div>
          );
        })}
      </div>
      <Rise delay={46} style={{ marginTop: 70, display: "flex", gap: 34 }}>
        {["ca", "cm", "cn"].map((c) => (
          <Img key={c} src={staticFile(`flags/${c}.svg`)} style={{ width: 120, height: 80, borderRadius: 14, objectFit: "cover", boxShadow: "0 12px 30px rgba(0,0,0,0.5)" }} />
        ))}
      </Rise>
    </AbsoluteFill>
  );
};

/** 2. Présentation de la marque : icône, logo, « une solution PWFINTECH ». */
export const IntroScene: React.FC<SceneProps> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <Img src={staticFile("brand/app-icon-1024.png")} style={{ width: 300, height: 300, borderRadius: 68, scale: String(0.6 + pop * 0.4), opacity: Math.min(1, pop * 1.4), boxShadow: "0 40px 90px -30px rgba(11,77,255,0.8)" }} />
      <Rise delay={8} style={{ marginTop: 80 }}>
        <Logo width={820} />
      </Rise>
      <Rise delay={18} style={{ marginTop: 40, fontFamily: FONT, fontWeight: 600, fontSize: 48, color: C.silver }}>
        {copy.intro.kicker}
      </Rise>
      <Rise delay={26} style={{ marginTop: 18, fontFamily: FONT, fontWeight: 500, fontSize: 40, color: C.muted, letterSpacing: 2 }}>
        {copy.intro.tagline}
      </Rise>
    </AbsoluteFill>
  );
};

/** 3. Montant : accueil, puis montant reçu imposé. */
export const AmountScene: React.FC<SceneProps & { receiveAt: number }> = ({ copy, lang, receiveAt }) => (
  <AbsoluteFill>
    <Title>{copy.amount.title}</Title>
    <Badge top={330} delay={20}>{copy.amount.badge}</Badge>
    <Phone shots={[[`screens/${lang}-home.png`, 0], [`screens/${lang}-receive.png`, receiveAt]]} />
  </AbsoluteFill>
);

/** 4. Destinataire : formulaire de l'appli et modes de réception. */
export const RecipientScene: React.FC<SceneProps> = ({ copy, lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Title>{copy.recipient.title}</Title>
      <Phone shots={[[`screens/${lang}-recipient.png`, 0]]} top={420} />
      {/* Modes de réception qui défilent en pastilles sur le téléphone */}
      <div style={{ position: "absolute", top: 1080, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
        {copy.recipient.methods.map((m, i) => {
          const p = spring({ frame: frame - 26 - i * 8, fps, config: { damping: 200 }, durationInFrames: 14 });
          return (
            <div
              key={m}
              style={{
                opacity: p,
                scale: String(0.8 + p * 0.2),
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 40,
                color: C.ink,
                background: C.white,
                borderRadius: 999,
                padding: "16px 30px",
                boxShadow: "0 16px 36px -14px rgba(0,0,0,0.8)",
              }}
            >
              {m}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** 5. Paiement : récapitulatif puis instructions du virement Interac. */
export const PayScene: React.FC<SceneProps & { interacAt: number }> = ({ copy, lang, interacAt }) => (
  <AbsoluteFill>
    <Title>{copy.pay.title}</Title>
    <Badge top={330} delay={16}>{copy.pay.badge}</Badge>
    <Phone shots={[[`screens/${lang}-review.png`, 0], [`screens/${lang}-interac.png`, interacAt]]} />
  </AbsoluteFill>
);

/** 6. Suivi : étapes, notification « argent reçu », reçu. */
export const TrackScene: React.FC<SceneProps & { notifAt: number; receiptAt: number }> = ({ copy, lang, notifAt, receiptAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const drop = interpolate(t, [notifAt, notifAt + 0.45, receiptAt - 0.2, receiptAt + 0.2], [-260, 0, 0, -260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill>
      <Title>{copy.track.title}</Title>
      <Phone shots={[[`screens/${lang}-tracking.png`, 0], [`screens/${lang}-receipt.png`, receiptAt]]} top={400} />
      {/* Notification push qui descend sur le téléphone */}
      <div style={{ position: "absolute", top: 470, left: 120, right: 120, translate: `0 ${drop}px`, opacity: drop < -200 ? 0 : 1 }}>
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            background: "rgba(255,255,255,0.97)",
            borderRadius: 40,
            padding: "26px 30px",
            boxShadow: "0 30px 60px -20px rgba(0,0,0,0.7)",
          }}
        >
          <Img src={staticFile("brand/app-icon-1024.png")} style={{ width: 92, height: 92, borderRadius: 22 }} />
          <div style={{ fontFamily: FONT, flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#6b6d73", letterSpacing: 1.2 }}>{copy.track.push.app}</div>
            <div style={{ fontSize: 38, fontWeight: 800, color: C.ink, marginTop: 4 }}>{copy.track.push.title}</div>
            <div style={{ fontSize: 30, fontWeight: 500, color: "#3f3f46", marginTop: 2 }}>{copy.track.push.body}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 7. Confiance : identité vérifiée, données protégées, 4 langues. */
export const TrustScene: React.FC<SceneProps> = ({ copy, lang }) => {
  const icons = {
    shield: "M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3zm-3.5 9l2.5 2.5L15.5 10",
    lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 017 0V11",
    globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z",
  };
  return (
    <AbsoluteFill>
      <Title>{copy.trust.title}</Title>
      <div style={{ position: "absolute", top: 330, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 22 }}>
        {copy.trust.items.map((it, i) => (
          <Rise key={it.label} delay={10 + i * 16 * 2.4}>
            <div style={{ display: "flex", alignItems: "center", gap: 26, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 30, padding: "24px 30px" }}>
              <div style={{ width: 76, height: 76, borderRadius: 999, background: C.brand, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" width={44} height={44} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={icons[it.icon]} />
                </svg>
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.white }}>{it.label}</div>
            </div>
          </Rise>
        ))}
      </div>
      <Phone shots={[[`screens/${lang}-language.png`, 0]]} top={760} width={400} enterDelay={30} />
    </AbsoluteFill>
  );
};

/** 8. Carton de fin. */
export const EndScene: React.FC<SceneProps> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80 }}>
      <Img src={staticFile("brand/app-icon-1024.png")} style={{ width: 240, height: 240, borderRadius: 56, scale: String(0.7 + pop * 0.3), opacity: Math.min(1, pop * 1.4) }} />
      <Rise delay={6} style={{ marginTop: 60 }}>
        <Logo width={800} />
      </Rise>
      <Rise delay={14} style={{ marginTop: 26, fontFamily: FONT, fontWeight: 600, fontSize: 46, color: C.silver }}>
        {copy.intro.kicker}
      </Rise>
      <Rise delay={44} style={{ marginTop: 80, fontFamily: FONT, fontWeight: 800, fontSize: 84, lineHeight: 1.08, letterSpacing: -2.4, color: C.white, textAlign: "center" }}>
        {copy.end.tagline}
      </Rise>
      <Rise delay={70} style={{ marginTop: 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.white, background: C.white + "18", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "18px 36px" }}>
          {copy.end.soon}
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 44, color: C.sky }}>{copy.end.url}</div>
      </Rise>
    </AbsoluteFill>
  );
};
