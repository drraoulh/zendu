import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "@/lib/session";
import { StoreProvider } from "@/lib/store";
import { colors } from "@/lib/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Montserrat-600": require("@/assets/fonts/Montserrat-600.ttf"),
    "Montserrat-800": require("@/assets/fonts/Montserrat-800.ttf"),
    "Montserrat-900": require("@/assets/fonts/Montserrat-900.ttf"),
  });

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Navigator fontsReady={fontsLoaded || Boolean(fontError)} />
        </StoreProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function Navigator({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useSession();
  const show = fontsReady && ready;

  useEffect(() => {
    if (show) void SplashScreen.hideAsync();
  }, [show]);

  if (!show) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transfer/[id]" />
    </Stack>
  );
}
