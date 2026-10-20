import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Text, View } from "react-native";
import { NumberedSteps } from "@/components/form";
import { Button, Card, H1, Header, Notice, P, Screen, Small } from "@/components/ui";
import { referralCode, useSession } from "@/lib/session";
import { useShare } from "@/lib/share";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

export default function Referral() {
  const { profile } = useSession();
  const [copied, setCopied] = useState(false);
  const sharer = useShare();
  if (!profile) return null;
  const code = referralCode(profile);

  return (
    <Screen>
      <Header title={tr("Parrainage")} />
      <H1>{tr("Parrainez vos proches")}</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Partagez votre code avec votre famille et vos amis pour qu'ils rejoignent WorldSoft Transfer.")}</P>
      <Card style={{ alignItems: "center", gap: 10, marginBottom: 18 }}>
        <Small>{tr("VOTRE CODE")}</Small>
        <Text style={{ fontFamily: fonts.display, fontSize: 30, color: colors.brand, letterSpacing: 1 }}>{code}</Text>
        <View style={{ flexDirection: "row", gap: 8, alignSelf: "stretch" }}>
          <Button
            title={copied ? tr("Copié") : tr("Copier")}
            icon={copied ? "check" : "copy"}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onPress={async () => {
              await Clipboard.setStringAsync(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          />
          <Button
            title={tr(sharer.label)}
            icon={sharer.copied ? "check" : "send"}
            size="sm"
            style={{ flex: 1 }}
            onPress={() => sharer.share(tr("Rejoins-moi sur WorldSoft Transfer (une solution PWFINTECH) pour envoyer de l'argent entre le Canada, le Cameroun et la Chine. Mon code : {0}", code))}
          />
        </View>
      </Card>
      <Text style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.ink, marginBottom: 12 }}>{tr("Comment ça marche")}</Text>
      <NumberedSteps
        steps={[
          { title: tr("Partagez votre code"), text: tr("Envoyez-le par message, courriel ou WhatsApp.") },
          { title: tr("Votre proche s'inscrit"), text: tr("Il installe WorldSoft Transfer et crée son compte en quelques minutes.") },
          { title: tr("Vous envoyez ensemble"), text: tr("Votre proche profite des mêmes services que vous.") },
        ]}
      />
      <View style={{ marginTop: 18 }}>
        <Notice tone="neutral" icon="info" text={tr("Le programme de récompenses n'est pas encore actif. Nous vous préviendrons dès son lancement.")} />
      </View>
    </Screen>
  );
}
