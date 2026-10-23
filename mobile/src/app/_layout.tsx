import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configurePush } from "@/lib/push";
import { enableAppSwitcherPrivacy, warnIfCompromisedDevice } from "@/lib/secure-screen";
import { SessionProvider, useSession } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { colors } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();
configurePush();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // DM Sans, la typographie du site (une seule famille pour les titres et le texte).
    "DMSans-400": require("@/assets/fonts/DMSans-400.ttf"),
    "DMSans-500": require("@/assets/fonts/DMSans-500.ttf"),
    "DMSans-600": require("@/assets/fonts/DMSans-600.ttf"),
    "DMSans-700": require("@/assets/fonts/DMSans-700.ttf"),
    "DMSans-800": require("@/assets/fonts/DMSans-800.ttf"),
  });

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <SessionProvider>
          <StoreProvider>
            <StatusBar style="dark" />
            <Navigator fontsReady={fontsLoaded || Boolean(fontError)} />
          </StoreProvider>
        </SessionProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

function Navigator({ fontsReady }: { fontsReady: boolean }) {
  const { ready, settings, locked } = useSession();
  const show = fontsReady && ready;
  const router = useRouter();
  const pathname = usePathname();

  // Appli verrouillée en cours d'utilisation (retour d'arrière-plan) : écran de déverrouillage, où qu'on soit.
  useEffect(() => {
    if (show && locked && pathname !== "/lock") router.replace("/lock");
  }, [show, locked, pathname, router]);

  useEffect(() => {
    if (!show) return;
    void SplashScreen.hideAsync();
    void enableAppSwitcherPrivacy();
    void warnIfCompromisedDevice();
  }, [show]);

  if (!show) return null;

  return (
    // Clé = langue : un changement de langue redessine tous les écrans avec les nouveaux textes.
    <Stack key={settings.language} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transfer/[id]" />
    </Stack>
  );
}
