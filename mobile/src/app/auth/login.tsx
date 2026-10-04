import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { WstWordmark } from "@/components/brand";
import { Button, Field, H1, Notice, P, Screen } from "@/components/ui";
import { biometricKind, type BiometricKind } from "@/lib/biometrics";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function Login() {
  const { checkPassword, signIn, settings, hasAccount } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bio, setBio] = useState<BiometricKind>("none");

  useEffect(() => {
    void biometricKind().then(setBio);
  }, []);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) return setError("Saisissez votre courriel et votre mot de passe.");
    setBusy(true);
    const ok = await checkPassword(email, password);
    setBusy(false);
    if (!ok) return setError("Courriel ou mot de passe incorrect.");
    if (settings.twoFactor) return router.push("/auth/two-factor");
    await signIn();
    router.replace("/");
  }

  const canBio = Platform.OS !== "web" && hasAccount && settings.biometric && bio !== "none";

  return (
    <Screen
      footer={
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 14, paddingBottom: 4 }}>
          Pas encore de compte ?{" "}
          <Link href="/auth/signup" replace style={{ color: colors.brand, fontFamily: fonts.semibold }}>
            Créer un compte
          </Link>
        </Text>
      }
    >
      <View style={{ paddingTop: 24, marginBottom: 24 }}>
        <WstWordmark size={34} />
      </View>
      <H1>Bon retour parmi nous</H1>
      <P style={{ marginTop: 6, marginBottom: 22 }}>Connectez-vous à WorldSoft Transfer pour envoyer et suivre vos transferts.</P>
      <Field
        label="Courriel"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      <Link href="/auth/forgot" style={{ color: colors.brand, fontFamily: fonts.semibold, fontSize: 14, marginBottom: 18 }}>
        Mot de passe oublié ?
      </Link>
      {error ? (
        <View style={{ marginBottom: 12 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}
      <Button title="Se connecter" onPress={submit} loading={busy} />
      {canBio ? (
        <Button title="Utiliser Face ID / empreinte" icon="face" variant="secondary" onPress={() => router.push("/auth/biometric")} style={{ marginTop: 10 }} />
      ) : null}
    </Screen>
  );
}
