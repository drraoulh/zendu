import Constants from "expo-constants";
import { router } from "expo-router";
import { View } from "react-native";
import { PoweredBy } from "@/components/brand";
import { Card, Header, ListItem, Screen, Small } from "@/components/ui";
import { company } from "@/lib/company";
import { openSite } from "@/lib/links";

/** Version lue dans app.json (au lieu d'un numéro écrit en dur). */
const VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function Legal() {
  return (
    <Screen>
      <Header title="Documents légaux" />
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="info" tone="neutral" title="Conditions d'utilisation" subtitle="Règles d'utilisation de WorldSoft Transfer" onPress={() => openSite("/conditions")} />
        <ListItem icon="lock" tone="neutral" title="Politique de confidentialité" subtitle="Vos données et vos droits" onPress={() => openSite("/confidentialite")} />
        <ListItem icon="cash" tone="neutral" title="Frais et limites" subtitle="Frais, taux et montants par envoi" onPress={() => openSite("/frais")} />
        {/* Pas de page « conformité » distincte sur le site : on explique la vérification d'identité dans l'aide. */}
        <ListItem
          icon="shield"
          tone="neutral"
          title="Vérification d'identité"
          subtitle="Pourquoi la réglementation l'impose"
          onPress={() => router.push({ pathname: "/help/[slug]", params: { slug: "verifier-identite" } })}
        />
      </Card>
      <View style={{ alignItems: "center", gap: 6, marginTop: 24 }}>
        <Small>Version de l&apos;appli : WorldSoft Transfer {VERSION}</Small>
        <PoweredBy />
        <Small style={{ textAlign: "center" }}>Éditeur : {company.legalName}</Small>
      </View>
    </Screen>
  );
}
