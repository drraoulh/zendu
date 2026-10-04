import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, Card, H1, P, Screen, SummaryRow } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";
import { frenchDate, hhmm } from "@/lib/dates";

export default function AppointmentDone() {
  const { reference, topic, mode, date, time } = useLocalSearchParams<{ reference: string; topic: string; mode: string; date: string; time: string }>();
  const { profile } = useSession();
  const [, m, d] = (date ?? "").split("-");
  const months = ["JANV.", "FÉVR.", "MARS", "AVR.", "MAI", "JUIN", "JUIL.", "AOÛT", "SEPT.", "OCT.", "NOV.", "DÉC."];

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Retour à Découvrir" onPress={() => router.replace("/(tabs)/discover")} />
          <Button title="Modifier le rendez-vous" variant="ghost" onPress={() => router.push({ pathname: "/help/contact", params: { subject: `Rendez-vous ${reference}` } })} />
        </View>
      }
    >
      <View style={{ alignItems: "center", paddingTop: 30, gap: 8 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={42} color={colors.success} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>Rendez-vous confirmé</H1>
        <P style={{ textAlign: "center" }}>Un rappel et les détails ont été envoyés à {profile?.email}.</P>
      </View>
      <Card style={{ marginTop: 18, flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 64, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.line, alignItems: "center" }}>
          <Text style={{ backgroundColor: colors.brand, color: colors.white, alignSelf: "stretch", textAlign: "center", fontFamily: fonts.heading, fontSize: 11, paddingVertical: 3 }}>
            {months[Number(m) - 1] ?? ""}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.navy, paddingVertical: 4 }}>{Number(d)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, color: colors.ink }}>{date ? frenchDate(date) : ""}</Text>
          <P>{time ? hhmm(time) : ""} · heure de l&apos;Est</P>
        </View>
      </Card>
      <Card>
        <SummaryRow label="Référence" value={reference ?? ""} strong />
        <SummaryRow label="Mode" value={mode === "phone" ? "Téléphone" : "Visio"} />
        <SummaryRow label="Sujet" value={topic ?? ""} />
      </Card>
    </Screen>
  );
}
