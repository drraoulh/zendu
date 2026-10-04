import { router } from "expo-router";
import { useState } from "react";
import { PasswordChecklist } from "@/components/form";
import { Button, Field, H1, Header, Notice, P, Screen } from "@/components/ui";
import { passwordScore, useSession } from "@/lib/session";

/** Après connexion avec un mot de passe temporaire donné par l'équipe : choix d'un nouveau mot de passe. */
export default function Reset() {
  const { replaceTemporaryPassword, signOut } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const match = confirm.length > 0 && confirm === password;

  async function save() {
    setError(null);
    if (passwordScore(password) < 4) return setError("Le mot de passe ne respecte pas toutes les règles.");
    if (!match) return setError("Les mots de passe ne correspondent pas.");
    setBusy(true);
    const r = await replaceTemporaryPassword(password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.replace("/auth/reset-done");
  }

  return (
    <Screen footer={<Button title="Enregistrer" onPress={save} loading={busy} />}>
      <Header
        title="Nouveau mot de passe"
        onBack={async () => {
          await signOut();
          router.replace("/auth/login");
        }}
      />
      <H1>Nouveau mot de passe</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>
        Vous vous êtes connecté avec un mot de passe temporaire. Choisissez un mot de passe que vous n&apos;utilisez pas ailleurs.
      </P>
      <Field label="Nouveau mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <PasswordChecklist value={password} />
      <Field
        label="Confirmer le mot de passe"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        hint={match ? "Les mots de passe correspondent" : undefined}
        error={confirm && !match ? "Les mots de passe ne correspondent pas" : null}
      />
      {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
    </Screen>
  );
}
