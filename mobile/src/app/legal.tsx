import { PoweredBy } from "@/components/brand";
import { View } from "react-native";
import { Card, Header, ListItem, Screen, Small } from "@/components/ui";
import { company } from "@/lib/company";
import { openSite } from "@/lib/links";

export default function Legal() {
  return (
    <Screen>
      <Header title="Documents légaux" />
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="info" tone="neutral" title="Conditions d'utilisation" subtitle="Règles d'utilisation de WorldSoft Transfer" onPress={() => openSite("/conditions")} />
        <ListItem icon="lock" tone="neutral" title="Politique de confidentialité" subtitle="Vos données et vos droits" onPress={() => openSite("/confidentialite")} />
        <ListItem icon="cash" tone="neutral" title="Frais et limites" subtitle="Frais, taux et montants par envoi" onPress={() => openSite("/frais")} />
        <ListItem icon="shield" tone="neutral" title="Avis de conformité" subtitle="Vérification d'identité et lutte contre la fraude" onPress={() => openSite("/conditions")} />
      </Card>
      <View style={{ alignItems: "center", gap: 6, marginTop: 24 }}>
        <Small>Version de l&apos;appli : WorldSoft Transfer 1.0.0</Small>
        <PoweredBy />
        <Small style={{ textAlign: "center" }}>Éditeur : {company.legalName}</Small>
      </View>
    </Screen>
  );
}
