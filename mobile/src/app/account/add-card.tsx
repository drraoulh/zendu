import { router } from "expo-router";
import { CardForm } from "@/components/card-form";
import { Header, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

export default function AddCard() {
  const { profile } = useSession();
  const { saveCard } = useStore();
  return (
    <Screen>
      <Header title="Ajouter une carte" />
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
