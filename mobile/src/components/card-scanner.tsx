import { requireOptionalNativeModule } from "expo";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { parseScannedCard } from "@/lib/cards";
import { colors, fonts, radius } from "@/lib/theme";
import { Icon } from "./icons";
import { Button } from "./ui";

/**
 * Reconnaissance de texte sur l'appareil (ML Kit sur Android, Vision sur iOS) via expo-text-extractor.
 * Absente d'Expo Go et du web : le scan n'est alors pas proposé (l'APK et les builds natifs l'ont).
 */
const ocr = requireOptionalNativeModule<{ isSupported: boolean; extractTextFromImage(path: string): Promise<string[]> }>("ExpoTextExtractor");

export const cardScanAvailable = Platform.OS !== "web" && !!ocr?.isSupported;

export type ScannedCard = { number: string; exp?: string; holder?: string };

/**
 * Plein écran caméra avec un cadre au format carte : une photo est analysée toutes les ~secondes
 * jusqu'à trouver un numéro valide. Rien n'est enregistré : les photos restent en cache et sont
 * écrasées, seul le résultat est rendu au formulaire.
 */
export function CardScanner({ visible, onClose, onScanned }: { visible: boolean; onClose: () => void; onScanned: (card: ScannedCard) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [visible, permission, requestPermission]);

  useEffect(() => {
    if (!visible || !ready || !ocr) return;
    let active = true;
    const hint = setTimeout(() => active && setSlow(true), 12000);
    void (async () => {
      while (active) {
        try {
          const photo = await camera.current?.takePictureAsync({ quality: 0.7, shutterSound: false });
          if (!active || !photo) break;
          const card = parseScannedCard(await ocr.extractTextFromImage(photo.uri.replace("file://", "")));
          if (active && card.number) {
            active = false;
            onScanned({ number: card.number, exp: card.exp, holder: card.holder });
            return;
          }
        } catch {
          // Photo ou lecture ratée (mise au point, caméra occupée) : on réessaie.
        }
        await new Promise((r) => setTimeout(r, 700));
      }
    })();
    return () => {
      active = false;
      clearTimeout(hint);
    };
  }, [visible, ready, onScanned]);

  function close() {
    setReady(false);
    setSlow(false);
    onClose();
  }

  const denied = permission && !permission.granted;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close} onDismiss={() => setReady(false)}>
      <View style={s.root}>
        {permission?.granted ? (
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" autofocus="on" onCameraReady={() => setReady(true)} />
        ) : null}
        <SafeAreaView style={s.overlay} edges={["top", "bottom"]}>
          <View style={s.top}>
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={close} style={s.close} hitSlop={10}>
              <Icon name="close" color={colors.white} size={22} />
            </Pressable>
            <Text style={s.title}>Scanner ma carte</Text>
            <View style={{ width: 44 }} />
          </View>

          {denied ? (
            <View style={s.denied}>
              <Icon name="camera" color={colors.white} size={36} />
              <Text style={s.deniedText}>Autorisez l&apos;appareil photo pour scanner votre carte.</Text>
              <Button
                title={permission.canAskAgain ? "Autoriser l'appareil photo" : "Ouvrir les réglages"}
                onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
              />
            </View>
          ) : (
            <View style={s.middle}>
              <View style={s.frame}>
                <View style={[s.corner, s.tl]} />
                <View style={[s.corner, s.tr]} />
                <View style={[s.corner, s.bl]} />
                <View style={[s.corner, s.br]} />
              </View>
              <Text style={s.help}>Placez le recto de la carte dans le cadre, bien éclairé et à plat.</Text>
              {slow ? <Text style={s.slow}>Approchez ou éloignez légèrement la carte, évitez les reflets.</Text> : null}
            </View>
          )}

          <View style={s.bottom}>
            <View style={s.privacy}>
              <Icon name="lock" color="rgba(255,255,255,0.75)" size={14} />
              <Text style={s.privacyText}>Lecture sur votre téléphone · aucune photo enregistrée ni envoyée</Text>
            </View>
            <Button title="Saisir à la main" variant="light" onPress={close} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const CORNER = 28;
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "space-between", paddingHorizontal: 20 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  title: { color: colors.white, fontFamily: fonts.heading, fontSize: 17 },
  middle: { alignItems: "center", gap: 16 },
  // Format ISO d'une carte bancaire : 85,6 × 54 mm.
  frame: { width: "100%", maxWidth: 420, aspectRatio: 85.6 / 54, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.04)" },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.lg },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.lg },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.lg },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.lg },
  help: { color: colors.white, fontFamily: fonts.semibold, fontSize: 15, textAlign: "center", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 6 },
  slow: { color: "#ffd479", fontSize: 13, textAlign: "center" },
  denied: { alignItems: "center", gap: 16, paddingHorizontal: 12 },
  deniedText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 15, textAlign: "center" },
  bottom: { gap: 12, paddingBottom: 12 },
  privacy: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  privacyText: { color: "rgba(255,255,255,0.75)", fontSize: 12, textAlign: "center", flexShrink: 1 },
});
