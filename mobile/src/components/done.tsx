import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { NumberedSteps } from "./form";
import { Icon } from "./icons";
import { Card, H1, P, Screen, Small } from "./ui";
import { colors, fonts } from "@/lib/theme";

/** Écran de confirmation après une demande de service. */
export function DoneScreen({
  title,
  text,
  reference,
  children,
  steps,
  footer,
}: {
  title: string;
  text: string;
  reference: string;
  children?: ReactNode;
  steps: { title: string; text: string }[];
  footer: ReactNode;
}) {
  return (
    <Screen footer={footer}>
      <View style={{ alignItems: "center", paddingTop: 24, gap: 8 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={42} color={colors.success} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>{title}</H1>
        <P style={{ textAlign: "center" }}>{text}</P>
      </View>
      <Card style={{ marginTop: 18, marginBottom: 14 }}>
        <Small>NUMÉRO DE DEMANDE</Small>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.brand, marginBottom: children ? 8 : 0 }}>{reference}</Text>
        {children}
      </Card>
      <Text style={{ fontFamily: fonts.heading, fontSize: 13, letterSpacing: 0.8, color: colors.muted, marginBottom: 12 }}>PROCHAINES ÉTAPES</Text>
      <NumberedSteps steps={steps} />
    </Screen>
  );
}
