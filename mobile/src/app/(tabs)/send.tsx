import { router } from "expo-router";
import { View } from "react-native";
import { Simulator } from "@/components/simulator";
import { H1, Notice, P, Screen, Steps } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

export default function Send() {
  const { profile } = useSession();
  const { draft, setDraft } = useStore();
  const kycDone = profile?.kyc === "verified";
  const pending = profile?.kyc === "pending";
  const kyc = profile?.kyc ?? "none";

  return (
    <Screen edges={["top"]}>
      <H1 style={{ marginTop: 8 }}>Envoyer de l&apos;argent</H1>
      <Steps current={1} total={3} label="Montant" />
      <P style={{ marginTop: 6, marginBottom: 18 }}>Choisissez le trajet et le montant. Le taux et les frais sont affichés avant tout paiement.</P>
      <Simulator
        key={draft.corridorId.split("-")[0]}
        corridorId={draft.corridorId}
        amount={draft.sendAmount}
        onChange={(n) => setDraft(n)}
        onContinue={pending ? undefined : () => router.push(kycDone ? "/send/recipient" : "/kyc")}
        ctaLabel={kycDone ? "Continuer" : "Vérifier mon identité"}
      />
      <View style={{ marginTop: 16, gap: 10 }}>
        {pending ? <Notice tone="warn" icon="clock" text="Votre identité est en cours de vérification. Vous pourrez envoyer dès qu'elle sera confirmée." /> : null}
        {kyc === "none" || kyc === "rejected" ? <Notice tone="warn" icon="shield" text="Votre identité doit être vérifiée avant votre premier envoi." /> : null}
        <Notice tone="neutral" icon="clock" text="Le devis est garanti 15 minutes. Passé ce délai, il est recalculé au taux du moment." />
      </View>
    </Screen>
  );
}
