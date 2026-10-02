import Image from "next/image";

type Variant = "horizontal" | "negative" | "symbol" | "stacked";

const FILES: Record<Variant, { src: string; width: number; height: number }> = {
  horizontal: { src: "/brand/wst/logo-horizontal.svg", width: 946, height: 148 },
  negative: { src: "/brand/wst/logo-horizontal-negative.svg", width: 946, height: 148 },
  symbol: { src: "/brand/wst/symbol.svg", width: 100, height: 100 },
  stacked: { src: "/brand/wst/logo-stacked.svg", width: 658, height: 318 },
};

const DEFAULT_CLASS: Record<Variant, string> = {
  horizontal: "h-8 w-auto",
  negative: "h-8 w-auto",
  symbol: "h-8 w-8",
  stacked: "h-20 w-auto",
};

/** Logo de l'application WorldSoft Transfer (une solution PWFINTECH). `negative` : sur fond bleu nuit. */
export function WstLogo({
  variant = "horizontal",
  className,
  priority = false,
}: {
  variant?: Variant;
  className?: string;
  priority?: boolean;
}) {
  const f = FILES[variant];
  return (
    <Image
      src={f.src}
      width={f.width}
      height={f.height}
      alt="WorldSoft Transfer"
      className={className ?? DEFAULT_CLASS[variant]}
      priority={priority}
      unoptimized
    />
  );
}
