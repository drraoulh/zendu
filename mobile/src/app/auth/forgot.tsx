import { router } from "expo-router";
import { useState } from "react";
import { Button, Field, H1, Header, Notice, P, Screen } from "@/components/ui";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Screen
      footer={
        sent ? (
          <Button title="Retour à la connexion" onPress={() => router.back()} />
        ) : (
          <Button title="Envoyer le lien" onPress={() => setSent(true)} disabled={!email.includes("@")} />
        )
      }
    >
      <Header title="Mot de passe oublié" />
      <H1>Réinitialiser le mot de passe</H1>
      <P style={{ marginTop: 6, marginBottom: 20 }}>Nous vous enverrons un lien pour choisir un nouveau mot de passe.</P>
      {sent ? (
        <Notice
          tone="success"
          icon="mail"
          title="Vérifiez votre boîte de réception"
          text={`Si un compte existe pour ${email.trim()}, un lien de réinitialisation vient d'être envoyé.`}
        />
      ) : (
        <Field
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      )}
    </Screen>
  );
}
