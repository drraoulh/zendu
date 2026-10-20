import Image from "next/image";
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** Bloc de section avec espacement vertical standard. */
export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`font-display text-base font-semibold sm:text-lg ${light ? "text-white/80" : "text-ink/70"}`}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  light = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <h2
        className={`mt-2 break-words font-display text-[2rem] font-bold leading-[1.05] min-[375px]:text-4xl sm:text-5xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? "text-white/70" : "text-muted"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-white p-6 shadow-card ${className}`}>{children}</div>;
}

type Tone = "brand" | "success" | "warn" | "danger" | "neutral";
const tones: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-success/10 text-success",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-surface-soft text-muted",
};

export function Badge({ children, tone = "brand" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * En-tête de page intérieure, sur fond graphite. Avec `image` : grande bannière photo
 * dans un cadre arrondi, texte blanc sur un fondu sombre (bannières de logitech.com).
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  image,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  image?: { src: string; alt: string };
}) {
  const content = (
    <>
      {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
      <h1 className="mt-3 max-w-3xl break-words font-display text-[2.25rem] font-bold leading-[1.04] min-[375px]:text-[2.6rem] sm:text-6xl">
        {title}
      </h1>
      {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{subtitle}</p>}
      {children && <div className="mt-8">{children}</div>}
    </>
  );

  if (image) {
    return (
      <section className="bg-white pt-4 sm:pt-6">
        <Container>
          <div className="relative isolate overflow-hidden rounded-3xl bg-navy text-white">
            <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="-z-10 object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
            <div className="px-6 py-16 sm:px-12 sm:py-24 lg:py-28">{content}</div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="bg-navy-gradient relative overflow-hidden text-white">
      <Container className="relative py-16 sm:py-24">{content}</Container>
    </section>
  );
}
