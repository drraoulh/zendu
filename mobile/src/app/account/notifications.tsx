import { router } from "expo-router";
import { useEffect, useState } from "react";

import { Linking, View } from "react-native";
import { SectionTitle, ToggleRow } from "@/components/form";
import { Badge, Button, Card, Header, ListItem, Notice, Screen } from "@/components/ui";
import { registerPush, unregisterPush, type PushStatus } from "@/lib/push";
import { useSession } from "@/lib/session";

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
      <Header title="Notifications" />
      <SectionTitle>Par courriel</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem
          icon="send"
          title="Suivi de vos transferts"
          subtitle={`Paiement reçu, argent livré, incident${profile?.email ? ` · ${profile.email}` : ""}`}
          subtitleLines={3}
          extra={
            <View style={{ marginTop: 6 }}>
              <Badge label="Toujours actif" tone="success" />
            </View>
          }
        />
        <ToggleRow icon="bell" label="Offres et nouveautés" sub="Promotions et nouveaux services PWFINTECH" value={marketing} onChange={toggleMarketing} disabled={saving} />
      </Card>
      {error ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}

      <SectionTitle>Dans l&apos;appli</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="bell" title="Centre de notifications" subtitle="Transferts, vérification d'identité et demandes" onPress={() => router.push("/notifications")} />
        <ToggleRow
          icon="phone"
          label="Notifications push"
          sub="Paiement reçu, argent livré, incident, identité vérifiée"
          value={pushWanted && push !== "denied"}
          onChange={(v) => void togglePush(v)}
        />
      </Card>
      {pushWanted && push === "denied" ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <Notice tone="warn" icon="bell" text="Les notifications sont bloquées dans les réglages du téléphone." />
          <Button title="Ouvrir les réglages" size="sm" variant="secondary" onPress={() => void Linking.openSettings()} />
        </View>
      ) : pushWanted && push === "unavailable" ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="neutral" icon="info" text="Notifications push indisponibles sur cet appareil pour le moment. Vous recevez toujours les courriels de suivi." />
        </View>
      ) : null}
    </Screen>
  );
}
