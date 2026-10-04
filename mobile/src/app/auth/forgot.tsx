import { router } from "expo-router";
import { useState } from "react";
import { Button, Field, H1, Header, Notice, P, Screen } from "@/components/ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send() {
    if (!EMAIL.test(email.trim())) return setError("Adresse courriel invalide");
    router.push({ pathname: "/auth/forgot-sent", params: { email: email.trim().toLowerCase() } });
  }

  return (
    <Screen footer={<Button title="Envoyer le lien" onPress={send} />}>
      <Header title="Mot de passe oublié" />
      <H1>Réinitialisez votre mot de passe</H1>
      <P style={{ marginTop: 6, marginBottom: 20 }}>
        Indiquez le courriel associé à votre compte. Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de passe.
      </P>
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
      <Notice tone="neutral" icon="clock" text="Le lien est valable 30 minutes. Pensez à vérifier vos courriels indésirables." />
    </Screen>
  );
}
