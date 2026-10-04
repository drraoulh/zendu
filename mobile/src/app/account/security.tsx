import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { ConfirmDialog, SectionTitle, ToggleRow } from "@/components/form";
import { Button, Card, Header, ListItem, Notice, Screen, Small } from "@/components/ui";
import { authenticate, biometricKind, biometricLabel, type BiometricKind } from "@/lib/biometrics";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

function since(iso?: string) {
  if (!iso) return "Jamais modifié";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "Modifié aujourd'hui";
  if (days < 31) return `Modifié il y a ${days} jour${days > 1 ? "s" : ""}`;
  return `Modifié il y a ${Math.floor(days / 30)} mois`;
}

export default function Security() {
  const { profile, settings, updateSettings, setPin, deleteAccount } = useSession();
  const { clearAll } = useStore();
  const [bio, setBio] = useState<BiometricKind>("none");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    void biometricKind().then(setBio);
  }, []);

  async function toggleBiometric(v: boolean) {
    setMessage(null);
    if (!v) return updateSettings({ biometric: false });
    if (bio === "none") return setMessage(Platform.OS === "web" ? "La biométrie n'est disponible que sur téléphone." : "Aucune biométrie configurée sur cet appareil.");
    const res = await authenticate(`Activer ${biometricLabel(bio)}`);
    if (res.ok) await updateSettings({ biometric: true });
    else setMessage(res.error);
  }

  const strong = settings.twoFactor && (settings.biometric || settings.pin);

  return (
    <Screen>
      <Header title="Sécurité" />
      <Notice
        tone={strong ? "success" : "warn"}
        icon="shield"
        title={strong ? "Votre compte est bien protégé" : "Renforcez la protection de votre compte"}
        text={strong ? "Deux étapes et verrouillage de l'appli activés." : "Activez la vérification en deux étapes et un verrouillage (PIN ou biométrie)."}
      />

      <SectionTitle>Connexion</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="lock" tone="neutral" title="Changer le mot de passe" subtitle={since(profile?.passwordChangedAt ?? profile?.createdAt)} onPress={() => router.push("/account/password")} />
        <ToggleRow icon="phone" label="Vérification en deux étapes" sub="Code par SMS à chaque connexion" value={settings.twoFactor} onChange={(v) => updateSettings({ twoFactor: v })} />
        <ToggleRow icon="face" label="Face ID / empreinte" sub="Pour ouvrir l'appli et vous connecter" value={settings.biometric} onChange={toggleBiometric} />
      </Card>
      {message ? <Small style={{ marginTop: 8 }}>{message}</Small> : null}

      <SectionTitle>Appareils et appli</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="phone" tone="neutral" title="Appareils connectés" subtitle="Cet appareil" onPress={() => router.push("/account/devices")} />
        <ToggleRow
          icon="lock"
          label="Code PIN de l'appli"
          sub={settings.pin ? "Activé · 6 chiffres" : "Désactivé"}
          value={settings.pin}
          onChange={(v) => (v ? router.push("/account/pin") : void setPin(null))}
        />
      </Card>

      <SectionTitle>Zone sensible</SectionTitle>
      <Button title="Supprimer mon compte" variant="danger" onPress={() => setConfirmDelete(true)} />
      <Small style={{ marginTop: 8 }}>La suppression est définitive. Vos reçus restent disponibles par courriel.</Small>

      <ConfirmDialog
        visible={confirmDelete}
        title="Supprimer votre compte ?"
        message="Vos informations, cartes et destinataires enregistrés sur cet appareil seront effacés. Cette action est définitive."
        confirmLabel="Supprimer définitivement"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          clearAll();
          await deleteAccount();
          router.replace("/welcome");
        }}
      />
    </Screen>
  );
}
