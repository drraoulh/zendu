import { router } from "expo-router";
import { useEffect, useState } from "react";

import { Linking, View } from "react-native";
import { SectionTitle, ToggleRow } from "@/components/form";
import { Badge, Button, Card, Header, ListItem, Notice, Screen } from "@/components/ui";
import { registerPush, unregisterPush, type PushStatus } from "@/lib/push";
import { useSession } from "@/lib/session";
import { tr } from "@/lib/i18n";

/**
 * Réglages des notifications : seulement ce qui existe vraiment.
 * - Courriels de suivi des transferts : toujours envoyés par le serveur (Brevo).
 * - Offres et nouveautés : consentement enregistré sur le compte (champ « marketing »).
 * - Push : paiement reçu, argent livré, incident, identité vérifiée (service push d'Expo).
 */
export default function NotificationSettings() {
  const { profile, update, settings, updateSettings } = useSession();
  const pushWanted = settings.notifications.push;
  const [push, setPush] = useState<PushStatus | null>(null);
  useEffect(() => {
    if (pushWanted) void registerPush(settings.language, false).then(setPush);
  }, [pushWanted, settings.language]);

  async function togglePush(v: boolean) {
    await updateSettings({ notifications: { ...settings.notifications, push: v } });
    if (v) setPush(await registerPush(settings.language, true));
    else {
      await unregisterPush();
      setPush(null);
    }
  }
  const [marketing, setMarketing] = useState(Boolean(profile?.marketing));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function toggleMarketing(v: boolean) {
    setError(null);
    setMarketing(v);
    setSaving(true);
    const r = await update({ marketing: v });
    setSaving(false);
    if (!r.ok) {
      setMarketing(!v);
      setError(r.error);
    }
  }

  return (
    <Screen>
      <Header title={tr("Notifications")} />
      <SectionTitle>{tr("Par courriel")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem
          icon="send"
          title={tr("Suivi de vos transferts")}
          subtitle={tr("Paiement reçu, argent livré, incident{0}", profile?.email ? ` · ${profile.email}` : "")}
          subtitleLines={3}
          extra={
            <View style={{ marginTop: 6 }}>
              <Badge label={tr("Toujours actif")} tone="success" />
            </View>
          }
        />
        <ToggleRow icon="bell" label={tr("Offres et nouveautés")} sub={tr("Promotions et nouveaux services PWFINTECH")} value={marketing} onChange={toggleMarketing} disabled={saving} />
      </Card>
      {error ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}

      <SectionTitle>{tr("Dans l'appli")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="bell" title={tr("Centre de notifications")} subtitle={tr("Transferts, vérification d'identité et demandes")} onPress={() => router.push("/notifications")} />
        <ToggleRow
          icon="phone"
          label={tr("Notifications push")}
          sub={tr("Paiement reçu, argent livré, incident, identité vérifiée")}
          value={pushWanted && push !== "denied"}
          onChange={(v) => void togglePush(v)}
        />
      </Card>
      {pushWanted && push === "denied" ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <Notice tone="warn" icon="bell" text={tr("Les notifications sont bloquées dans les réglages du téléphone.")} />
          <Button title={tr("Ouvrir les réglages")} size="sm" variant="secondary" onPress={() => void Linking.openSettings()} />
        </View>
      ) : pushWanted && push === "unavailable" ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="neutral" icon="info" text={tr("Notifications push indisponibles sur cet appareil pour le moment. Vous recevez toujours les courriels de suivi.")} />
        </View>
      ) : null}
    </Screen>
  );
}
