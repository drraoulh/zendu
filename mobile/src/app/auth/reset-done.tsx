import { router } from "expo-router";
import { View } from "react-native";
import { Icon } from "@/components/icons";
import { Button, H1, Notice, P, Screen } from "@/components/ui";
import { colors } from "@/lib/theme";

export default function ResetDone() {
  return (
    <Screen footer={<Button title="Continuer" onPress={() => router.replace("/")} />}>
      <View style={{ alignItems: "center", paddingTop: 80, gap: 12 }}>
        <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={42} color={colors.success} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>Mot de passe modifié</H1>
        <P style={{ textAlign: "center" }}>Votre nouveau mot de passe est enregistré. Utilisez-le désormais pour vous connecter à WorldSoft Transfer.</P>
      </View>
      <View style={{ marginTop: 20 }}>
        <Notice tone="brand" icon="shield" text="Les autres appareils ont été déconnectés par sécurité." />
      </View>
    </Screen>
  );
}
