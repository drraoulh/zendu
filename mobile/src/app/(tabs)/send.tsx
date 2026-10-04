import { router } from "expo-router";
import { View } from "react-native";
import { Simulator } from "@/components/simulator";
import { H1, Notice, P, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

export default function Send() {
  const { profile } = useSession();
  const { draft, setDraft } = useStore();
  const kycDone = profile?.kyc === "verified";

  return (
    <Screen edges={["top"]}>
      <H1 style={{ marginTop: 8 }}>Envoyer de l&apos;argent</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>Choisissez le trajet et le montant. Le taux et les frais sont affichés avant tout paiement.</P>
      <Simulator
        corridorId={draft.corridorId}
        amount={draft.sendAmount}
        onChange={(n) => setDraft(n)}
        onContinue={() => router.push(kycDone ? "/send/recipient" : "/kyc")}
        ctaLabel={kycDone ? "Choisir le bénéficiaire" : "Vérifier mon identité"}
      />
      <View style={{ marginTop: 16, gap: 10 }}>
        {!kycDone ? <Notice tone="warn" icon="shield" text="Votre identité doit être vérifiée avant votre premier envoi." /> : null}
        <Notice tone="neutral" icon="clock" text="Le devis est garanti 15 minutes. Passé ce délai, il est recalculé au taux du moment." />
      </View>
    </Screen>
  );
}
