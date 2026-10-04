import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, H1, Header, Notice, P, Screen } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function ForgotSent() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [resent, setResent] = useState(false);
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="J'ai reçu le lien" onPress={() => router.push({ pathname: "/auth/reset", params: { email } })} />
          <Button title="Modifier l'adresse" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      <Header title="Courriel envoyé" />
      <View style={{ alignItems: "center", paddingTop: 30, gap: 12 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="mail" size={40} color={colors.brand} />
        </View>
        <H1 style={{ textAlign: "center" }}>Vérifiez votre boîte de réception</H1>
        <P style={{ textAlign: "center" }}>
          Si un compte existe, un lien de réinitialisation a été envoyé à <Text style={{ color: colors.ink }}>{email}</Text>. Ouvrez-le depuis ce téléphone pour continuer.
        </P>
        <Button title={resent ? "Lien renvoyé" : "Rien reçu ? Renvoyer"} variant="ghost" size="sm" icon={resent ? "check" : "refresh"} onPress={() => setResent(true)} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Notice tone="neutral" icon="info" text="Version de démonstration : aucun courriel n'est envoyé. Touchez « J'ai reçu le lien » pour continuer." />
      </View>
    </Screen>
  );
}
