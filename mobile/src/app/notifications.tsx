import { router, type Href } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { SectionTitle } from "@/components/form";
import { Icon } from "@/components/icons";
import { Button, Card, Empty, Header, ListItem, Notice, Screen, Small } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { dayGroup } from "@/lib/notifications";
import { colors, fonts } from "@/lib/theme";
import { useNotifications } from "@/lib/use-notifications";

export default function Notifications() {
  const { list, unread, isRead, markAllRead, markRead, loading, failed, reload } = useNotifications();
  const groups = list.reduce<Record<string, typeof list>>((acc, n) => {
    const g = dayGroup(n.at);
    (acc[g] ??= []).push(n);
    return acc;
  }, {});

  return (
    <Screen>
      <Header title="Notifications" right={<Button title="Réglages" variant="ghost" size="sm" onPress={() => router.push("/account/notifications")} />} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
        {/* flexShrink 0 : à 320 px, « 5 non lues » passait sur deux lignes à côté du bouton. */}
        <Text style={{ fontFamily: fonts.heading, color: colors.ink, flexShrink: 0 }}>
          {unread.length} non lue{unread.length > 1 ? "s" : ""}
        </Text>
        {unread.length ? <Button title="Tout marquer comme lu" variant="ghost" size="sm" onPress={markAllRead} /> : null}
      </View>
      {failed ? (
        <View style={{ marginVertical: 10, gap: 8 }}>
          <Notice tone="warn" icon="alert" text="Impossible de charger vos transferts pour le moment. Vérifiez votre connexion." />
          <Button title="Réessayer" variant="secondary" size="sm" onPress={() => void reload()} />
        </View>
      ) : null}
      {/* Premier chargement : pas de « Aucune notification » trompeur pendant la requête. */}
      {loading && !list.length ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} />
      ) : list.length ? (
        Object.entries(groups).map(([g, items]) => (
          <View key={g}>
            <SectionTitle>{g}</SectionTitle>
            <Card style={{ paddingVertical: 4 }}>
              {items.map((n) => (
                <ListItem
                  key={n.id}
                  icon={n.icon}
                  tone={n.tone}
                  title={n.title}
                  subtitle={`${n.text}\n${dateTime(n.at)}`}
                  subtitleLines={4}
                  onPress={() => {
                    markRead([n.id]);
                    if (n.href) router.push(n.href as Href);
                  }}
                  right={!isRead(n.id) ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand }} /> : n.href ? <Icon name="chev" size={18} color={colors.muted} /> : <View />}
                />
              ))}
            </Card>
          </View>
        ))
      ) : failed ? null : (
        <Empty icon="bell" title="Aucune notification" text="Vous serez prévenu ici à chaque étape de vos transferts." />
      )}
      <Small style={{ textAlign: "center", marginTop: 16 }}>Les notifications push arriveront avec la version publiée sur les stores. En attendant, vous êtes prévenu par courriel.</Small>
    </Screen>
  );
}
