import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { SectionTitle, ToggleRow } from "@/components/form";
import { Badge, Card, Header, ListItem, Notice, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";

/**
 * Réglages des notifications : seulement ce qui existe vraiment.
 * - Courriels de suivi des transferts : toujours envoyés par le serveur (Brevo).
 * - Offres et nouveautés : consentement enregistré sur le compte (champ « marketing »).
 * - Push : pas encore disponibles (version publiée sur les stores).
 */
export default function NotificationSettings() {
  const { profile, update } = useSession();
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
        <ListItem
          icon="phone"
          tone="neutral"
          title="Notifications push"
          subtitle="Avec la version publiée sur les stores"
          extra={
            <View style={{ marginTop: 6 }}>
              <Badge label="Bientôt" />
            </View>
          }
        />
      </Card>
    </Screen>
  );
}
