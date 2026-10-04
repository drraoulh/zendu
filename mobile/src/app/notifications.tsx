import { router, type Href } from "expo-router";
import { Text, View } from "react-native";
import { SectionTitle } from "@/components/form";
import { Icon } from "@/components/icons";
import { Button, Card, Empty, Header, ListItem, Screen, Small } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { dayGroup } from "@/lib/notifications";
import { colors, fonts } from "@/lib/theme";
import { useNotifications } from "@/lib/use-notifications";

export default function Notifications() {
  const { list, unread, isRead, markAllRead, markRead } = useNotifications();
  const groups = list.reduce<Record<string, typeof list>>((acc, n) => {
    const g = dayGroup(n.at);
    (acc[g] ??= []).push(n);
    return acc;
  }, {});

  return (
    <Screen>
      <Header title="Notifications" right={<Button title="Réglages" variant="ghost" size="sm" onPress={() => router.push("/account/notifications")} />} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontFamily: fonts.heading, color: colors.ink }}>
          {unread.length} non lue{unread.length > 1 ? "s" : ""}
        </Text>
        {unread.length ? <Button title="Tout marquer comme lu" variant="ghost" size="sm" onPress={markAllRead} /> : null}
      </View>
      {list.length ? (
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
      ) : (
        <Empty icon="bell" title="Aucune notification" text="Vous serez prévenu ici à chaque étape de vos transferts." />
      )}
      <Small style={{ textAlign: "center", marginTop: 16 }}>Les notifications push seront activées avec la version publiée sur les stores.</Small>
    </Screen>
  );
}
