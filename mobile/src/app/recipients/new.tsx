import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Chips } from "@/components/form";
import { RecipientForm } from "@/components/recipient-form";
import { H1, Header, Label, Screen } from "@/components/ui";
import { COUNTRIES, COUNTRY_CODES, FALLBACK_CORRIDORS, type CountryCode } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

/** Ajout (ou modification avec ?id=) d'un destinataire. */
export default function NewRecipient() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useSession();
  const { recipients, saveRecipient } = useStore();
  const existing = recipients.find((r) => r.id === id);
  const home = (profile?.country ?? "CA") as CountryCode;
  const [country, setCountry] = useState<CountryCode>((existing?.country as CountryCode) ?? (home === "CM" ? "CA" : "CM"));
  const networks = FALLBACK_CORRIDORS.find((c) => c.destination === country)?.networks ?? [];

  return (
    <Screen>
      <Header title={existing ? "Modifier le destinataire" : "Ajouter un destinataire"} />
      <H1 style={{ marginBottom: 16 }}>{existing ? existing.fullName : "Nouveau destinataire"}</H1>
      {!existing ? (
        <>
          <Label>Pays de destination</Label>
          <Chips options={COUNTRY_CODES.map((c) => ({ value: c, label: COUNTRIES[c].name }))} value={country} onChange={setCountry} />
        </>
      ) : null}
      <RecipientForm
        key={country}
        country={country}
        networks={networks}
        initial={existing}
        withRelation
        submitLabel="Enregistrer"
        onSubmit={(r) => {
          saveRecipient({ ...r, id: existing?.id });
          router.back();
        }}
      />
    </Screen>
  );
}
