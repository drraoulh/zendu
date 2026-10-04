import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, Empty, H1, Header, P, Screen, Small } from "@/components/ui";
import { findArticle, HELP_CATEGORIES } from "@/lib/help";
import { colors, fonts } from "@/lib/theme";

export default function Article() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const a = findArticle(slug);
  const [vote, setVote] = useState<"yes" | "no" | null>(null);

  if (!a) {
    return (
      <Screen>
        <Header title="Article d'aide" />
        <Empty icon="help" title="Article introuvable" text="Revenez au centre d'aide." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Article d'aide" />
      <Small style={{ color: colors.brand, fontFamily: fonts.semibold }}>Aide · {HELP_CATEGORIES.find((c) => c.id === a.category)?.label}</Small>
      <H1 style={{ marginTop: 6 }}>{a.title}</H1>
      <P style={{ marginTop: 8, marginBottom: 16 }}>{a.intro}</P>
      <Card style={{ gap: 14, marginBottom: 14 }}>
        {a.sections.map((s) => (
          <View key={s.title}>
            <Text style={{ fontFamily: fonts.heading, color: colors.ink, fontSize: 15 }}>{s.title}</Text>
            <Small style={{ marginTop: 2 }}>{s.text}</Small>
          </View>
        ))}
      </Card>
      {a.bullets ? (
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: fonts.heading, color: colors.ink, fontSize: 15, marginBottom: 8 }}>{a.bullets.title}</Text>
          {a.bullets.items.map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, paddingVertical: 3 }}>
              <Icon name="chev" size={14} color={colors.brand} />
              <Small style={{ flex: 1, color: colors.ink }}>{i}</Small>
            </View>
          ))}
        </Card>
      ) : null}
      <Card style={{ alignItems: "center", gap: 10 }}>
        <Text style={{ fontFamily: fonts.semibold, color: colors.ink }}>{vote ? "Merci pour votre retour !" : "Cet article vous a-t-il aidé ?"}</Text>
        {!vote ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Oui" size="sm" variant="secondary" onPress={() => setVote("yes")} />
            <Button title="Non" size="sm" variant="secondary" onPress={() => setVote("no")} />
          </View>
        ) : null}
        {vote === "no" ? <Small>Toujours bloqué ? Notre équipe peut vous aider.</Small> : null}
      </Card>
      <Button title="Nous contacter" icon="mail" variant="ghost" onPress={() => router.push({ pathname: "/help/contact", params: { subject: a.title } })} style={{ marginTop: 10 }} />
    </Screen>
  );
}
