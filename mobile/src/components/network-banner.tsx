import { useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { networkState } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

/** Bandeau discret en haut de l'écran quand le dernier échange avec le serveur a échoué ; disparaît dès que ça repasse. */
export function NetworkBanner() {
  const offline = useSyncExternalStore(networkState.subscribe, networkState.isOffline, () => false);
  const insets = useSafeAreaInsets();
  if (!offline) return null;
  return (
    <View
      accessibilityRole="alert"
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: insets.top + 4, paddingBottom: 8, paddingHorizontal: 16, backgroundColor: colors.ink, zIndex: 50 }}
    >
      <Text style={{ color: colors.white, fontFamily: fonts.medium, fontSize: 13, textAlign: "center" }}>{tr("Pas de connexion. Vérifiez votre réseau, nous réessayons à chaque action.")}</Text>
    </View>
  );
}
