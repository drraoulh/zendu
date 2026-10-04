import { View } from "react-native";
import { PoweredBy } from "@/components/brand";
import { Card, H1, H2, ListItem, P, Screen } from "@/components/ui";
import { openSite } from "@/lib/links";

export default function Discover() {
  return (
    <Screen edges={["top"]}>
      <H1 style={{ marginTop: 8 }}>Services</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>WorldSoft Transfer fait partie de PWFINTECH. Découvrez nos autres activités.</P>

      <Card style={{ paddingVertical: 6, marginBottom: 16 }}>
        <ListItem icon="ship" title="Expédition de colis" subtitle="Canada · Cameroun · Chine, par avion ou bateau" onPress={() => openSite("/shipping")} />
        <ListItem icon="finance" title="Finances" subtitle="Conseil, accompagnement et services financiers" onPress={() => openSite("/finances")} />
        <ListItem icon="tech" title="Technologies" subtitle="Développement web, mobile et solutions numériques" onPress={() => openSite("/technologies")} />
      </Card>

      <H2 style={{ fontSize: 18, marginBottom: 10 }}>Informations</H2>
      <Card style={{ paddingVertical: 6 }}>
        <ListItem icon="cash" tone="neutral" title="Frais et taux" onPress={() => openSite("/frais")} />
        <ListItem icon="globe" tone="neutral" title="Pays desservis" onPress={() => openSite("/pays")} />
        <ListItem icon="info" tone="neutral" title="À propos de PWFINTECH" onPress={() => openSite("/a-propos")} />
      </Card>

      <View style={{ alignItems: "center", marginTop: 24 }}>
        <PoweredBy />
      </View>
    </Screen>
  );
}
