import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WstSymbol } from "@/components/brand";
import { Icon } from "@/components/icons";
import { PinPad } from "@/components/pin-pad";
import { Button, H1, P, Small } from "@/components/ui";
import { authenticate, biometricLabel, biometricKind, type BiometricKind } from "@/lib/biometrics";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

/** Ouverture de l'appli : code PIN et/ou Face ID / empreinte (écran « Connexion biométrique »). */
export default function Lock() {
  const { profile, checkPin, unlock, settings, signOut } = useSession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<BiometricKind>("none");
  const [recognized, setRecognized] = useState(false);
  const usePin = settings.pin;

  const done = useCallback(() => {
    unlock();
    router.replace("/");
  }, [unlock]);

  const bio = useCallback(async () => {
    const res = await authenticate("Déverrouiller WorldSoft Transfer");
    if (res.ok) {
      setRecognized(true);
      setTimeout(done, 400);
    } else setError(res.error);
  }, [done]);

  useEffect(() => {
    if (!settings.biometric) return;
    void biometricKind().then((k) => {
      setKind(k);
      if (k !== "none") void bio();
    });
  }, [settings.biometric, bio]);

  async function onPin(v: string) {
    setError(null);
    setPin(v);
    if (v.length < 6) return;
    if (await checkPin(v)) done();
    else {
      setError("Code incorrect");
      setPin("");
    }
  }

  async function withPassword() {
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
      <WstSymbol size={52} />
      <H1 style={{ textAlign: "center", fontSize: 24 }}>Bonjour {profile?.firstName}</H1>
      {usePin ? (
        <>
          <Small>Saisissez votre code PIN</Small>
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : <View style={{ height: 18 }} />}
          <PinPad value={pin} onChange={onPin} extra={settings.biometric && kind !== "none" ? { label: `Utiliser ${biometricLabel(kind)}`, onPress: bio } : undefined} />
        </>
      ) : (
        <>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 36,
              backgroundColor: recognized ? colors.successSoft : colors.brandSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={recognized ? "check" : "face"} size={60} color={recognized ? colors.success : colors.brand} strokeWidth={1.6} />
          </View>
          <H1 style={{ textAlign: "center", fontSize: 22 }}>{recognized ? "Identité reconnue" : "Regardez votre téléphone"}</H1>
          <P style={{ textAlign: "center" }}>{biometricLabel(kind)} vérifie votre identité pour vous connecter en tant que {profile?.firstName}.</P>
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <Button title="Réessayer" icon="face" onPress={bio} style={{ alignSelf: "stretch" }} />
        </>
      )}
      <Button title="Utiliser le mot de passe" variant="ghost" size="sm" onPress={withPassword} />
    </SafeAreaView>
  );
}
