import { router } from "expo-router";
import { useState } from "react";
import { PasswordChecklist } from "@/components/form";
import { Button, Field, Header, Notice, P, Screen } from "@/components/ui";
import { passwordScore, useSession } from "@/lib/session";

export default function ChangePassword() {
  const { changePassword } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save() {
    setError(null);
    if (passwordScore(next) < 4) return setError("Le nouveau mot de passe ne respecte pas toutes les règles.");
    if (next !== confirm) return setError("La confirmation ne correspond pas.");
    if (next === current) return setError("Choisissez un mot de passe différent de l'actuel.");
    const ok = await changePassword(current, next);
    if (!ok) return setError("Mot de passe actuel incorrect.");
    setDone(true);
    setTimeout(() => router.back(), 1200);
  }

  return (
    <Screen footer={<Button title="Mettre à jour le mot de passe" onPress={save} disabled={done} />}>
      <Header title="Changer le mot de passe" />
      <P style={{ marginBottom: 18 }}>Choisissez un mot de passe que vous n&apos;utilisez sur aucun autre site.</P>
      <Field label="Mot de passe actuel" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" />
      <Field label="Nouveau mot de passe" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <PasswordChecklist value={next} />
      <Field label="Confirmer le nouveau mot de passe" value={confirm} onChangeText={setConfirm} placeholder="Saisissez-le à nouveau" secureTextEntry autoComplete="new-password" />
      {error ? <Notice tone="danger" icon="alert" text={error} /> : done ? <Notice tone="success" icon="check" text="Mot de passe mis à jour." /> : (
        <Notice tone="neutral" icon="info" text="Vous serez déconnecté de vos autres appareils après le changement." />
      )}
    </Screen>
  );
}
