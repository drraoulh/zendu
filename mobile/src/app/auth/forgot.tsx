import { router } from "expo-router";
import { useState } from "react";
import { Button, Field, H1, Header, Notice, P, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { tr } from "@/lib/i18n";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!EMAIL.test(email.trim())) return setError(tr("Adresse courriel invalide"));
    setBusy(true);
    try {
      await api.passwordReset(email.trim().toLowerCase());
      router.push({ pathname: "/auth/forgot-sent", params: { email: email.trim().toLowerCase() } });
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Envoi impossible"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title={tr("Envoyer la demande")} onPress={send} loading={busy} />}>
      <Header title={tr("Mot de passe oublié")} />
      <H1>{tr("Réinitialisez votre mot de passe")}</H1>
      <P style={{ marginTop: 6, marginBottom: 20 }}>{tr("Indiquez le courriel associé à votre compte. Notre équipe vous enverra un mot de passe temporaire.")}</P>
      <Field
        label={tr("Adresse courriel")}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={send}
        error={error}
      />
      <Notice tone="neutral" icon="clock" text={tr("À la connexion avec le mot de passe temporaire, vous choisirez un nouveau mot de passe. Pensez à vérifier vos courriels indésirables.")} />
    </Screen>
  );
}
