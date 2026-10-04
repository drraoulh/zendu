import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { WstSymbol } from "@/components/brand";
import { Button, Field, H1, Header, Notice, P, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

export default function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || password.length < 1) return setError("Saisissez votre e-mail et votre mot de passe.");
    setBusy(true);
    const ok = await signIn(email);
    setBusy(false);
    if (!ok) return setError("Aucun compte trouvé avec cet e-mail sur cet appareil.");
    router.replace("/");
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <Button title="Se connecter" onPress={submit} loading={busy} />
          <Text style={{ textAlign: "center", color: colors.muted, fontSize: 14 }}>
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" replace style={{ color: colors.brand, fontFamily: fonts.semibold }}>
              S&apos;inscrire
            </Link>
          </Text>
        </View>
      }
    >
      <Header />
      <WstSymbol size={56} />
      <H1 style={{ marginTop: 16 }}>Bon retour !</H1>
      <P style={{ marginTop: 6, marginBottom: 22 }}>Connectez-vous pour envoyer de l&apos;argent et suivre vos transferts.</P>
      <Field
        label="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" />
      <Link href="/auth/forgot" style={{ color: colors.brand, fontFamily: fonts.semibold, fontSize: 14, marginBottom: 16 }}>
        Mot de passe oublié ?
      </Link>
      {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
    </Screen>
  );
}
