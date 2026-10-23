import { router } from "expo-router";
import { useState } from "react";
import { PasswordChecklist } from "@/components/form";
import { Button, Field, Header, Notice, P, Screen } from "@/components/ui";
import { passwordScore, useSession } from "@/lib/session";
import { tr } from "@/lib/i18n";
import { useSecureScreen } from "@/lib/secure-screen";

export default function ChangePassword() {
  useSecureScreen();
  const { changePassword } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    if (!current) return setError(tr("Saisissez votre mot de passe actuel."));
    if (passwordScore(next) < 4) return setError(tr("Le nouveau mot de passe ne respecte pas toutes les règles."));
    if (next !== confirm) return setError(tr("La confirmation ne correspond pas."));
    if (next === current) return setError(tr("Choisissez un mot de passe différent de l'actuel."));
    setBusy(true);
    const r = await changePassword(current, next);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setDone(true);
    setTimeout(() => router.back(), 1200);
  }

  return (
    <Screen footer={<Button title={tr("Mettre à jour le mot de passe")} onPress={save} loading={busy} disabled={done} />}>
      <Header title={tr("Changer le mot de passe")} />
      <P style={{ marginBottom: 18 }}>{tr("Choisissez un mot de passe que vous n'utilisez sur aucun autre site.")}</P>
      <Field label={tr("Mot de passe actuel")} value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" />
      <Field label={tr("Nouveau mot de passe")} value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <PasswordChecklist value={next} />
      <Field label={tr("Confirmer le nouveau mot de passe")} value={confirm} onChangeText={setConfirm} placeholder={tr("Saisissez-le à nouveau")} secureTextEntry autoComplete="new-password" />
      {error ? <Notice tone="danger" icon="alert" text={error} /> : done ? <Notice tone="success" icon="check" text={tr("Mot de passe mis à jour.")} /> : (
        <Notice tone="neutral" icon="info" text={tr("Vous serez déconnecté de vos autres appareils après le changement.")} />
      )}
    </Screen>
  );
}
