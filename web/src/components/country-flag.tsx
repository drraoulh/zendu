"use client";

type Props = {
  code: string;
  size?: number;
  className?: string;
  title?: string;
};

/** Drapeaux SVG/PNG via flagcdn (plus fiables que les emoji selon OS). */
export function CountryFlag({ code, size = 24, className = "", title }: Props) {
  const cc = code.toLowerCase() === "uk" ? "gb" : code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${cc}.png`}
      srcSet={`https://flagcdn.com/w40/${cc}.png 1x, https://flagcdn.com/w80/${cc}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={title ?? code}
      title={title ?? code}
      className={`inline-block rounded-sm object-cover shadow-sm ${className}`}
      loading="lazy"
    />
  );
}
