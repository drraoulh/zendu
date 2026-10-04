import { router } from "expo-router";
import { useState } from "react";
import { Button, Field, H1, Header, Notice, P, Screen } from "@/components/ui";
import { api } from "@/lib/api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!EMAIL.test(email.trim())) return setError("Adresse courriel invalide");
    setBusy(true);
    try {
      await api.passwordReset(email.trim().toLowerCase());
      router.push({ pathname: "/auth/forgot-sent", params: { email: email.trim().toLowerCase() } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title="Envoyer la demande" onPress={send} loading={busy} />}>
      <Header title="Mot de passe oublié" />
      <H1>Réinitialisez votre mot de passe</H1>
      <P style={{ marginTop: 6, marginBottom: 20 }}>Indiquez le courriel associé à votre compte. Notre équipe vous enverra un mot de passe temporaire.</P>
      <Field
        label="Adresse courriel"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />
      <Notice tone="neutral" icon="clock" text="À la connexion avec le mot de passe temporaire, vous choisirez un nouveau mot de passe. Pensez à vérifier vos courriels indésirables." />
    </Screen>
  );
}
