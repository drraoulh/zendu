import { router } from "expo-router";
import { View } from "react-native";
import { CardForm } from "@/components/card-form";
import { Header, Notice, P, Screen } from "@/components/ui";
import { payMethodsOf, useCorridors } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

export default function AddCard() {
  const { profile } = useSession();
  const { saveCard } = useStore();
  // Carte de débit : démonstration seulement (fermée par le serveur en mode réel).
  const cardsOpen = useCorridors().some((c) => payMethodsOf(c).includes("card"));
  return (
    <Screen>
      <Header title="Ajouter une carte" />
      {cardsOpen ? (
        <>
          <P style={{ marginBottom: 10 }}>Carte de débit Visa ou Mastercard, à votre nom. Les cartes de crédit ne sont pas acceptées.</P>
          <View style={{ marginBottom: 14 }}>
            <Notice tone="warn" icon="info" text="Version de démonstration : aucune carte n'est débitée." />
          </View>
          <CardForm
            defaultHolder={profile ? `${profile.firstName} ${profile.lastName}` : ""}
            submitLabel="Enregistrer la carte"
            onSubmit={(c) => {
              saveCard(c);
              router.back();
            }}
          />
        </>
      ) : (
        <Notice tone="neutral" icon="info" text="Le paiement par carte n'est pas encore disponible. Payez vos envois par virement Interac." />
      )}
    </Screen>
  );
}
