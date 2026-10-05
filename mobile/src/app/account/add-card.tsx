import { router } from "expo-router";
import { CardForm } from "@/components/card-form";
import { Header, P, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

export default function AddCard() {
  const { profile } = useSession();
  const { saveCard } = useStore();
  return (
    <Screen>
      <Header title="Ajouter une carte" />
      <P style={{ marginBottom: 14 }}>Visa ou Mastercard, à votre nom. Elle servira à payer vos transferts.</P>
      <CardForm
        defaultHolder={profile ? `${profile.firstName} ${profile.lastName}` : ""}
        submitLabel="Enregistrer la carte"
        onSubmit={(c) => {
          saveCard(c);
          router.back();
        }}
      />
    </Screen>
  );
}
