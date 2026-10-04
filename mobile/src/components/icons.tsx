import Svg, { Path } from "react-native-svg";

/** Icônes trait 24×24 (mêmes tracés que le site). */
const PATHS = {
  home: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z",
  send: "M4 7h13l-3-3M20 17H7l3 3",
  history: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6m-6 4h6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0",
  back: "M15 5l-7 7 7 7",
  chev: "M9 6l6 6-6 6",
  chevDown: "M6 9l6 6 6-6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  swap: "M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v4l3 2",
  lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 017 0V11",
  phone: "M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm3 17h2",
  bank: "M3 10l9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18",
  cash: "M3 7h18v10H3zM12 15a3 3 0 100-6 3 3 0 000 6zM6 10v4m12-4v4",
  plus: "M12 5v14M5 12h14",
  shield: "M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3zm-3.5 9l2.5 2.5L15.5 10",
  bell: "M6 17h12l-1.5-2V10a4.5 4.5 0 00-9 0v5zM10 20h4",
  finance: "M3 20h18M5 20V10m4 10V6m4 14v-8m4 8V4",
  tech: "M4 5h16v11H4zM2 19h20M9 16v3m6-3v3",
  ship: "M3 17l2 3h14l2-3M5 17V11h14v6M8 11V7h8v4M12 3v4",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  id: "M3 5h18v14H3zM8 13a2 2 0 100-4 2 2 0 000 4zm-3 4c.5-1.5 1.7-2.5 3-2.5s2.5 1 3 2.5M14 9h4m-4 3h4",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z",
  face: "M12 21a9 9 0 100-18 9 9 0 000 18zM9 10h.01M15 10h.01M8.5 14.5a5 5 0 007 0",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zm0-5v-5m0-3h.01",
  alert: "M12 3l10 18H2zM12 10v4m0 3h.01",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z",
  copy: "M8 8h12v12H8zM4 16V4h12",
  help: "M12 21a9 9 0 100-18 9 9 0 000 18zm-2.5-11.5a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5m0 3h.01",
  wallet: "M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H3zM3 7l12-4v4M16.5 13.5h.01",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  color = "#0a1838",
  strokeWidth = 1.9,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      <Path d={PATHS[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
