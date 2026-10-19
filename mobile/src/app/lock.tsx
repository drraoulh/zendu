import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const { profile, checkPin, unlock, settings, signOut, locked } = useSession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  // null : détection de la biométrie en cours.
  const [kind, setKind] = useState<BiometricKind | null>(null);
  const [recognized, setRecognized] = useState(false);
  const usePin = settings.pin;
  const failures = useRef(0);
  const label = biometricLabel(kind ?? "none");

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
    if (!settings.biometric || !locked) return;
    void biometricKind().then((k) => {
      setKind(k);
      if (k !== "none") void bio();
    });
  }, [settings.biometric, locked, bio]);

  async function onPin(v: string) {
    setError(null);
    setPin(v);
    if (v.length < 6) return;
    if (await checkPin(v)) return done();
    // 5 codes faux de suite : retour à la connexion par mot de passe (protège contre les essais au hasard).
    failures.current += 1;
    setPin("");
    if (failures.current >= 5) return withPassword();
    const left = 5 - failures.current;
    setError(`Code incorrect · ${left} essai${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""}`);
  }

  async function withPassword() {
    await signOut();
    router.replace("/auth/login");
  }

  // Rien à déverrouiller (lien direct, web, verrou désactivé) : retour à l'accueil.
  if (!locked && !recognized) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 16, padding: 20 }}>
      <WstSymbol size={52} />
      <H1 style={{ textAlign: "center", fontSize: 24 }}>{profile?.firstName ? `Bonjour ${profile.firstName}` : "Bonjour"}</H1>
      {usePin ? (
        <>
          <Small>Saisissez votre code PIN</Small>
          {error ? <Text style={{ color: colors.danger, textAlign: "center" }}>{error}</Text> : <View style={{ height: 18 }} />}
          <PinPad value={pin} onChange={onPin} extra={settings.biometric && kind && kind !== "none" ? { label: `Utiliser ${label}`, onPress: bio } : undefined} />
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
          <H1 style={{ textAlign: "center", fontSize: 22 }}>{recognized ? "Identité reconnue" : kind === "fingerprint" ? "Posez votre doigt sur le capteur" : "Regardez votre téléphone"}</H1>
          <P style={{ textAlign: "center" }}>
            {kind === "none"
              ? "Aucune biométrie n'est disponible sur cet appareil. Connectez-vous avec votre mot de passe."
              : `${label.charAt(0).toUpperCase()}${label.slice(1)} vérifie votre identité pour ouvrir l'appli.`}
          </P>
          {error ? <Text style={{ color: colors.danger, textAlign: "center" }}>{error}</Text> : null}
          {kind && kind !== "none" ? <Button title="Réessayer" icon="face" onPress={bio} style={{ alignSelf: "stretch" }} /> : null}
        </>
      )}
      <Button title="Se connecter avec le mot de passe" variant="ghost" size="sm" onPress={withPassword} />
    </SafeAreaView>
  );
}
