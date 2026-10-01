/** Jeu d'icônes trait (24×24, stroke currentColor). */
const PATHS = {
  transfer: "M4 7h13l-3-3M20 17H7l3 3",
  finance: "M3 20h18M5 20V10m4 10V6m4 14v-8m4 8V4",
  tech: "M4 5h16v11H4zM2 19h20M9 16v3m6-3v3",
  ship: "M3 17l2 3h14l2-3M5 17V11h14v6M8 11V7h8v4M12 3v4",
  shield: "M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3zm-3.5 9l2.5 2.5L15.5 10",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v4l3 2",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  pin: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrowRight: "M5 12h14m-6-6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  chart: "M4 19l5-6 4 3 7-9M15 7h5v5",
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M15.5 4.1a3.5 3.5 0 010 6.8",
  lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 017 0V11",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  wallet: "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H3zM3 7l12-4v4M16.5 13.5h.01",
  code: "M8 8l-4 4 4 4m8-8l4 4-4 4M13.5 5l-3 14",
  box: "M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9",
  plane: "M2 16l20-8-4 12-6-4-3 4v-5l9-7-12 6z",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  sparkle: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M18 6l-2.5 2.5m-7 7L6 18",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6m-6 4h6",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  gift: "M4 11h16v10H4zM2 7h20v4H2zM12 7v14M12 7S10 3 7.5 3 5 5.5 7 7m5 0s2-4 4.5-4S19 5.5 17 7",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-5v-5m0-3h.01",
  maple: "M12 2l1.6 3.4 2.3-1-1 4.6 3.1-2.2.6 2.3 3.4-.6-1.7 3.3 1.7.9-5 3.8.8 2.1-4.6-.9V22h-1.4v-4.3l-4.6.9.8-2.1-5-3.8 1.7-.9L2 8.5l3.4.6.6-2.3 3.1 2.2-1-4.6 2.3 1z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  const filled = name === "maple";
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
