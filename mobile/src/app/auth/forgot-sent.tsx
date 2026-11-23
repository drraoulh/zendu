import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Button, H1, Header, Notice, P, Screen } from "@/components/ui";
import { tr } from "@/lib/i18n";

export default function ForgotSent() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title={tr("Retour à la connexion")} onPress={() => router.replace("/auth/login")} />
          <Button title={tr("Modifier l'adresse")} variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      <Header title={tr("Demande envoyée")} />
      <View style={{ alignItems: "center", paddingTop: 30, gap: 12 }}>
        <H1 style={{ textAlign: "center" }}>{tr("Vérifiez votre boîte de réception")}</H1>
        <P style={{ textAlign: "center" }}>
          {email
            ? tr("Si un compte existe pour {0}, notre équipe vous envoie un mot de passe temporaire par courriel.", email)
            : tr("Si un compte existe pour cette adresse, notre équipe vous envoie un mot de passe temporaire par courriel.")}
        </P>
      </View>
      <View style={{ marginTop: 16 }}>
        <Notice tone="brand" icon="lock" text={tr("Connectez-vous avec ce mot de passe temporaire : l'appli vous demandera aussitôt d'en choisir un nouveau.")} />
      </View>
    </Screen>
  );
}
