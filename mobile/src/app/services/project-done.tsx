import { router, useLocalSearchParams } from "expo-router";
import { DoneScreen } from "@/components/done";
import { Button, SummaryRow } from "@/components/ui";
import { useSession } from "@/lib/session";

export default function ProjectDone() {
  const { reference, types, budget, timeline } = useLocalSearchParams<{ reference: string; types: string; budget: string; timeline: string }>();
  const { profile } = useSession();
  return (
    <DoneScreen
      title="Demande envoyée"
      text={`Merci ${profile?.firstName ?? ""}. Un membre de l'équipe Technologies vous recontacte par courriel pour planifier un premier échange.`}
      reference={reference ?? ""}
      steps={[
        { title: "Étude de votre demande", text: "Nous analysons vos besoins et votre budget." },
        { title: "Appel de découverte", text: "Un échange pour préciser vos objectifs." },
        { title: "Proposition détaillée", text: "Périmètre, étapes et devis, sans engagement." },
      ]}
      footer={<Button title="Retour à Découvrir" onPress={() => router.replace("/(tabs)/discover")} />}
    >
      <SummaryRow label="Projet" value={types ?? ""} />
      <SummaryRow label="Budget indicatif" value={budget ?? ""} />
      <SummaryRow label="Délai souhaité" value={timeline ?? ""} />
    </DoneScreen>
  );
}
