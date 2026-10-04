import { router } from "expo-router";
import { View } from "react-native";
import { NumberedSteps } from "@/components/form";
import { Offer, PoleHero } from "@/components/pole";
import { Button, Card, H2, Header, Screen } from "@/components/ui";
import { openSite } from "@/lib/links";

export default function Technologies() {
  return (
    <Screen footer={<Button title="Décrire mon projet" icon="tech" onPress={() => router.push("/services/project")} />}>
      <Header title="Technologies" right={<Button title="Site" variant="ghost" size="sm" onPress={() => openSite("/technologies")} />} />
      <PoleHero icon="tech" label="PÔLE TECHNOLOGIES" title="Donnons vie à votre projet numérique" text="De l'idée au lancement, avec une équipe à votre écoute." />
      <Card style={{ paddingVertical: 4, marginBottom: 18 }}>
        <Offer icon="phone" title="Sites web & applications mobiles" text="Vitrines, boutiques en ligne, applis iOS et Android." />
        <Offer icon="wallet" title="Solutions de paiement / fintech" text="Paiement en ligne, Mobile Money, portefeuilles numériques." />
        <Offer icon="grid" title="Transformation numérique & conseil IT" text="Outils, processus et infrastructure pour votre organisation." />
        <Offer icon="shield" title="Maintenance & support" text="Mises à jour, sécurité et assistance au quotidien." />
      </Card>
      <H2 style={{ fontSize: 17, marginBottom: 12 }}>Notre processus</H2>
      <NumberedSteps
        steps={[
          { title: "Découverte", text: "Vos objectifs, votre public, votre budget." },
          { title: "Conception", text: "Maquettes et parcours validés avec vous." },
          { title: "Développement", text: "Livraisons régulières et tests." },
          { title: "Lancement & suivi", text: "Mise en ligne, formation et maintenance." },
        ]}
      />
      <View style={{ height: 8 }} />
    </Screen>
  );
}
