import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

/**
 * Drapeaux dessinés en SVG (hors ligne) pour les pays ouverts : Canada, Cameroun, Chine.
 * Les autres codes affichent une pastille neutre.
 */
export function Flag({ code, size = 28 }: { code: string; size?: number }) {
  const w = size;
  const h = Math.round(size * 0.7);
  const content = (() => {
    switch (code) {
      case "CA":
        return (
          <>
            <Rect x="0" y="0" width="30" height="20" fill="#ffffff" />
            <Rect x="0" y="0" width="7.5" height="20" fill="#d52b1e" />
            <Rect x="22.5" y="0" width="7.5" height="20" fill="#d52b1e" />
            <Path d="M15 4l1 2.2 1.4-.6-.6 3 2-1.4.4 1.1 1.9-.4-.9 1.9 1 .5-3 2.3.5 1.1-2.7-.5V16h-1v-2.8l-2.7.5.5-1.1-3-2.3 1-.5-.9-1.9 1.9.4.4-1.1 2 1.4-.6-3 1.4.6z" fill="#d52b1e" />
          </>
        );
      case "CM":
        return (
          <>
            <Rect x="0" y="0" width="10" height="20" fill="#007a5e" />
            <Rect x="10" y="0" width="10" height="20" fill="#ce1126" />
            <Rect x="20" y="0" width="10" height="20" fill="#fcd116" />
            <Path d="M15 6.6l.9 2.8h2.9l-2.4 1.7.9 2.8-2.3-1.7-2.3 1.7.9-2.8-2.4-1.7h2.9z" fill="#fcd116" />
          </>
        );
      case "CN":
        return (
          <>
            <Rect x="0" y="0" width="30" height="20" fill="#ee1c25" />
            <Path d="M5 2.2l.9 2.8h2.9L6.5 6.7l.9 2.8L5 7.8 2.6 9.5l.9-2.8-2.4-1.7H4z" fill="#ffff00" />
            <Path d="M10.5 1.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM12.5 3.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM12.5 6.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM10.5 8.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9z" fill="#ffff00" />
          </>
        );
      default:
        return <Rect x="0" y="0" width="30" height="20" fill="#e6edff" />;
    }
  })();
  return (
    <View style={{ width: w, height: h, borderRadius: 4, overflow: "hidden", borderWidth: 0.5, borderColor: "rgba(10,24,56,0.12)" }}>
      <Svg width={w} height={h} viewBox="0 0 30 20" preserveAspectRatio="none">
        {content}
      </Svg>
    </View>
  );
}
