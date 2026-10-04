import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { WstWordmark } from "@/components/brand";
import { Button, Field, H1, Notice, P, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function Login() {
  const { startSignIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) return setError("Saisissez votre courriel et votre mot de passe.");
    setBusy(true);
    const r = await startSignIn(email, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (r.needsCode) return router.push("/auth/two-factor");
    router.replace(r.mustChangePassword ? "/auth/reset" : "/");
  }

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
    </Screen>
  );
}
