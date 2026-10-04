import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-6 ${className}`}>{children}</div>;
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
    <section id={id} className={`py-16 sm:py-20 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.18em] ${
        light ? "text-sky" : "text-brand"
      }`}
    >
      <span className={`h-px w-6 ${light ? "bg-sky" : "bg-brand"}`} />
      {children}
    </p>
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
        className={`mt-3 break-words font-display text-[1.75rem] font-extrabold leading-tight tracking-tight min-[375px]:text-3xl sm:text-4xl ${
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

/** En-tête de page intérieure (pages services, compte…), sur fond bleu nuit. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="bg-navy-gradient relative overflow-hidden text-white">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative py-16 sm:py-20">
        {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-3xl break-words font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight min-[375px]:text-4xl sm:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
