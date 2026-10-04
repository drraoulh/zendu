import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WstSymbol } from "@/components/brand";
import { PinPad } from "@/components/pin-pad";
import { Button, H1, Small } from "@/components/ui";
import { authenticate } from "@/lib/biometrics";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

export default function Lock() {
  const { profile, checkPin, unlock, settings, signOut } = useSession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bio = settings.biometric && Platform.OS !== "web";

  async function useBiometric() {
    const res = await authenticate("Déverrouiller WorldSoft Transfer");
    if (res.ok) {
      unlock();
      router.replace("/");
    }
  }

  useEffect(() => {
    if (pin.length !== 6) return;
    void checkPin(pin).then((ok) => {
      if (ok) {
        unlock();
        router.replace("/");
      } else {
        setError("Code incorrect");
        setPin("");
      }
    });
  }, [pin, checkPin, unlock]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 18, padding: 20 }}>
      <WstSymbol size={52} />
      <H1 style={{ textAlign: "center", fontSize: 24 }}>Bonjour {profile?.firstName}</H1>
      <Small>Saisissez votre code PIN</Small>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : <View style={{ height: 18 }} />}
      <PinPad
        value={pin}
        onChange={(v) => {
          setError(null);
          setPin(v);
        }}
        extra={bio ? { label: "Utiliser la biométrie", onPress: useBiometric } : undefined}
      />
      <Button
        title="Se connecter avec le mot de passe"
        variant="ghost"
        size="sm"
        onPress={async () => {
          await signOut();
          router.replace("/auth/login");
        }}
      />
    </SafeAreaView>
  );
}
