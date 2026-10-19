"use client";

type Props = {
  code: string;
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Drapeaux. Canada, Cameroun et Chine sont dessinés en SVG (comme dans l'appli) : hors ligne et nets
 * à toute taille, utile pour les vidéos. Les autres pays passent par flagcdn.
 */
export function CountryFlag({ code, size = 24, className = "", title }: Props) {
  const upper = code.toUpperCase();
  const label = title ?? code;
  if (upper === "CA" || upper === "CM" || upper === "CN") {
    return (
      <svg
        viewBox="0 0 30 20"
        preserveAspectRatio="none"
        width={size}
        height={Math.round(size * 0.75)}
        role="img"
        aria-label={label}
        className={`inline-block shrink-0 overflow-hidden rounded-sm shadow-sm ${className}`}
      >
        <title>{label}</title>
      {upper === "CA" ? (
        <>
          <rect width="30" height="20" fill="#ffffff" />
          <rect width="7.5" height="20" fill="#d52b1e" />
          <rect x="22.5" width="7.5" height="20" fill="#d52b1e" />
          <path d="M15 4l1 2.2 1.4-.6-.6 3 2-1.4.4 1.1 1.9-.4-.9 1.9 1 .5-3 2.3.5 1.1-2.7-.5V16h-1v-2.8l-2.7.5.5-1.1-3-2.3 1-.5-.9-1.9 1.9.4.4-1.1 2 1.4-.6-3 1.4.6z" fill="#d52b1e" />
        </>
      ) : upper === "CM" ? (
        <>
          <rect width="10" height="20" fill="#007a5e" />
          <rect x="10" width="10" height="20" fill="#ce1126" />
          <rect x="20" width="10" height="20" fill="#fcd116" />
          <path d="M15 6.6l.9 2.8h2.9l-2.4 1.7.9 2.8-2.3-1.7-2.3 1.7.9-2.8-2.4-1.7h2.9z" fill="#fcd116" />
        </>
      ) : upper === "CN" ? (
        <>
          <rect width="30" height="20" fill="#ee1c25" />
          <path d="M5 2.2l.9 2.8h2.9L6.5 6.7l.9 2.8L5 7.8 2.6 9.5l.9-2.8-2.4-1.7H4z" fill="#ffff00" />
          <path d="M10.5 1.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM12.5 3.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM12.5 6.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM10.5 8.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9z" fill="#ffff00" />
        </>
      ) : (
        <rect width="30" height="20" fill="#e6edff" />
      )}
      </svg>
    );
  }
  const cc = code.toLowerCase() === "uk" ? "gb" : code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${cc}.png`}
      srcSet={`https://flagcdn.com/w40/${cc}.png 1x, https://flagcdn.com/w80/${cc}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={label}
      title={label}
      className={`inline-block overflow-hidden rounded-sm bg-surface-soft object-cover text-[0px] shadow-sm ${className}`}
      loading="lazy"
    />
  );
}
