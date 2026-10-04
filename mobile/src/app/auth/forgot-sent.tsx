import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, H1, Header, Notice, P, Screen } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function ForgotSent() {
  const { email } = useLocalSearchParams<{ email: string }>();
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Retour à la connexion" onPress={() => router.replace("/auth/login")} />
          <Button title="Modifier l'adresse" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      <Header title="Demande envoyée" />
      <View style={{ alignItems: "center", paddingTop: 30, gap: 12 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="mail" size={40} color={colors.brand} />
        </View>
        <H1 style={{ textAlign: "center" }}>Vérifiez votre boîte de réception</H1>
        <P style={{ textAlign: "center" }}>
          Si un compte existe pour <Text style={{ color: colors.ink }}>{email}</Text>, notre équipe vous envoie un mot de passe temporaire par courriel.
        </P>
      </View>
      <View style={{ marginTop: 16 }}>
        <Notice tone="brand" icon="lock" text="Connectez-vous avec ce mot de passe temporaire : l'appli vous demandera aussitôt d'en choisir un nouveau." />
      </View>
    </Screen>
  );
}
