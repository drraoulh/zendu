import { router } from "expo-router";
import { Offer, PoleHero } from "@/components/pole";
import { Button, Card, Header, Notice, Screen } from "@/components/ui";
import { openSite } from "@/lib/links";

export default function Finances() {
  return (
    <Screen footer={<Button title="Prendre rendez-vous" icon="clock" onPress={() => router.push("/services/appointment")} />}>
      <Header title="Finances" right={<Button title="Site" variant="ghost" size="sm" onPress={() => openSite("/finances")} />} />
      <PoleHero icon="finance" label="PÔLE FINANCES" title="Prenez de bonnes décisions pour votre argent" text="Un accompagnement personnalisé, pour vous et pour vos proches au pays." />
      <Card style={{ paddingVertical: 4, marginBottom: 14 }}>
        <Offer icon="wallet" title="Conseil & budget" text="Faire le point sur vos revenus, dépenses et transferts réguliers." />
        <Offer icon="finance" title="Épargne et objectifs" text="Définir un objectif (études, maison, projet au pays) et un plan pour l'atteindre." />
        <Offer icon="bank" title="Accompagnement PME et entrepreneurs" text="Structurer votre activité, vos flux et vos besoins de financement." />
        <Offer icon="help" title="Éducation financière" text="Ateliers et ressources pour mieux gérer votre argent." />
      </Card>
      <Notice tone="neutral" icon="info" text="Accompagnement et éducation, pas un conseil en placement réglementé." />
    </Screen>
  );
}
