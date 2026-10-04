import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { DoneScreen } from "@/components/done";
import { Button, SummaryRow } from "@/components/ui";

export default function ShippingDone() {
  const p = useLocalSearchParams<{ reference: string; origin: string; destination: string; mode: string; weight: string; dims?: string; content: string }>();
  const city = (p.destination ?? "").split(",")[0];
  return (
    <DoneScreen
      title="Demande de devis reçue"
      text="Votre devis détaillé arrive par courriel."
      reference={p.reference ?? ""}
      steps={[
        { title: "Dépôt du colis", text: "Au point de dépôt indiqué dans votre devis (ou ramassage si demandé)." },
        { title: "Paiement", text: "Une fois le devis accepté." },
        { title: "Expédition", text: `Suivi de votre colis jusqu'à ${city || "destination"}.` },
      ]}
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Suivre mes colis" onPress={() => router.replace("/services/tracking")} />
          <Button title="Retour" variant="ghost" onPress={() => router.replace("/(tabs)/discover")} />
        </View>
      }
    >
      <SummaryRow label="Trajet" value={`${(p.origin ?? "").split(",")[0]} → ${city}`} strong />
      <SummaryRow label="Mode" value={p.mode === "sea" ? "Maritime" : "Aérien"} />
      <SummaryRow label="Poids estimé" value={p.weight ?? ""} />
      {p.dims ? <SummaryRow label="Dimensions" value={`${p.dims} cm`} /> : null}
      <SummaryRow label="Contenu" value={p.content ?? ""} />
    </DoneScreen>
  );
}
