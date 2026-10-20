import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { SectionTitle, ToggleRow } from "@/components/form";
import { Button, Card, Field, Header, ListItem, Notice, Screen, Small } from "@/components/ui";
import { authenticate, biometricKind, biometricLabel, type BiometricKind } from "@/lib/biometrics";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { tr } from "@/lib/i18n";

function since(iso?: string) {
  if (!iso) return tr("Jamais modifié");
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return tr("Modifié aujourd'hui");
  if (days < 31) return tr("Modifié il y a {0} jour{1}", days, days > 1 ? "s" : "");
  return tr("Modifié il y a {0} mois", Math.floor(days / 30));
}

export default function Security() {
  const { profile, settings, updateSettings, setPin, deleteAccount } = useSession();
  const { clearAll } = useStore();
  const [bio, setBio] = useState<BiometricKind>("none");
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleteError(null);
    setDeleting(true);
    const r = await deleteAccount(password);
    setDeleting(false);
    if (!r.ok) return setDeleteError(r.error);
    clearAll();
    router.replace("/welcome");
  }

  useEffect(() => {
    void biometricKind().then(setBio);
  }, []);

  async function toggleBiometric(v: boolean) {
    setMessage(null);
    if (!v) return updateSettings({ biometric: false });
    if (bio === "none") return setMessage(Platform.OS === "web" ? tr("La biométrie n'est disponible que sur téléphone.") : tr("Aucune biométrie configurée sur cet appareil."));
    const res = await authenticate(tr("Activer {0}", biometricLabel(bio)));
    if (res.ok) await updateSettings({ biometric: true });
    else setMessage(res.error);
  }

  // La vérification en deux étapes est imposée par le serveur à chaque connexion : seul le verrouillage
  // de l'appli (PIN ou biométrie) reste au choix de l'utilisateur.
  const strong = settings.biometric || settings.pin;
  // Sur le web, l'appli ne se verrouille pas (ni PIN ni biométrie) : on ne propose pas un réglage sans effet.
  const web = Platform.OS === "web";

  return (
    <Screen>
      <Header title={tr("Sécurité")} />
      <Notice
        tone={strong || web ? "success" : "warn"}
        icon="shield"
        title={strong || web ? tr("Votre compte est bien protégé") : tr("Renforcez la protection de votre compte")}
        text={
          strong
            ? tr("Vérification en deux étapes et verrouillage de l'appli activés.")
            : web
              ? tr("La vérification en deux étapes est active : un code vous est demandé à chaque connexion.")
              : tr("La vérification en deux étapes est active. Ajoutez un verrouillage de l'appli (PIN ou biométrie).")
        }
      />

      <SectionTitle>{tr("Connexion")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="lock" tone="neutral" title={tr("Changer le mot de passe")} subtitle={since(profile?.passwordChangedAt ?? profile?.createdAt)} onPress={() => router.push("/account/password")} />
        <ListItem icon="shield" tone="success" title={tr("Vérification en deux étapes")} subtitle={tr("Toujours active : un code par courriel à chaque connexion")} />
        <ToggleRow
          icon="face"
          label={tr("Face ID / empreinte")}
          sub={web ? tr("Disponible dans l'appli sur téléphone") : tr("Pour déverrouiller l'appli à l'ouverture")}
          value={settings.biometric && !web}
          onChange={toggleBiometric}
          disabled={web}
        />
      </Card>
      {message ? <Small style={{ marginTop: 8 }}>{tr(message)}</Small> : null}

      <SectionTitle>{tr("Appareils et appli")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="phone" tone="neutral" title={tr("Appareils connectés")} subtitle={tr("Gérer les sessions")} onPress={() => router.push("/account/devices")} />
        <ToggleRow
          icon="lock"
          label={tr("Code PIN de l'appli")}
          sub={web ? tr("Disponible dans l'appli sur téléphone") : settings.pin ? tr("Activé · 6 chiffres") : tr("Désactivé")}
          value={settings.pin && !web}
          disabled={web}
          onChange={(v) => (v ? router.push("/account/pin") : void setPin(null))}
        />
      </Card>

      <SectionTitle>{tr("Zone sensible")}</SectionTitle>
      {confirmDelete ? (
        <Card>
          <Small style={{ marginBottom: 12, color: colors.ink }}>
            {tr("Votre compte, vos informations, cartes et destinataires seront effacés. Cette action est définitive. Confirmez avec votre mot de passe.")}
          </Small>
          <Field label={tr("Mot de passe")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" error={deleteError} />
          <View style={{ gap: 8 }}>
            <Button title={tr("Supprimer définitivement")} variant="danger" onPress={remove} loading={deleting} disabled={!password} />
            <Button
              title={tr("Annuler")}
              variant="secondary"
              onPress={() => {
                setConfirmDelete(false);
                setPassword("");
                setDeleteError(null);
              }}
            />
          </View>
        </Card>
      ) : (
        <Button title={tr("Supprimer mon compte")} variant="danger" onPress={() => setConfirmDelete(true)} />
      )}
      <Small style={{ marginTop: 8 }}>{tr("La suppression est définitive. Les transferts déjà effectués restent archivés par PWFINTECH, sans lien avec votre compte.")}</Small>
    </Screen>
  );
}
