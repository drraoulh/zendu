import { router } from "expo-router";
import { fonts } from "@/lib/theme";
import { useState } from "react";
import { PaymentLogo } from "@/components/payment-logo";
import { RecipientForm } from "@/components/recipient-form";
import { Button, Card, H1, H2, Header, ListItem, P, Screen, SEND_STEPS, Steps } from "@/components/ui";
import { findCorridor, useCorridors, type CountryCode } from "@/lib/corridors";
import { countryName, networkLabel, phone } from "@/lib/format";
import { useStore, type Recipient } from "@/lib/store";
import { tr } from "@/lib/i18n";

export default function ChooseRecipient() {
  const { draft, setDraft, recipients } = useStore();
  const corridor = findCorridor(useCorridors(), draft.corridorId);
  const country = corridor.destination as CountryCode;
  const saved = recipients.filter((r) => r.country === country);
  const [adding, setAdding] = useState(saved.length === 0);

  // Un nouveau bénéficiaire n'est enregistré qu'une fois le transfert créé (voir processing.tsx) :
  // un envoi commencé puis abandonné ne laisse pas de contact dans la liste.
  function choose(r: Recipient, save = false) {
    setDraft({ recipient: r, recipientFromHome: false, saveRecipient: save });
    router.push("/send/review");
  }

  return (
    <Screen>
      <Header title={tr("Bénéficiaire")} subtitle={tr("Vers {0}", countryName(country))} />
      <Steps current={2} total={3} label={tr("Destinataire")} names={SEND_STEPS} />
      <H1>{tr("À qui envoyez-vous ?")}</H1>
      <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Le nom doit correspondre à celui du compte ou de la pièce d'identité du bénéficiaire.")}</P>

      {saved.length && !adding ? (
        <>
          <Card style={{ paddingVertical: 6, marginBottom: 14 }}>
            {saved.map((r) => (
              <ListItem
                key={r.id}
                title={r.fullName}
                subtitle={`${networkLabel(r.network)} · ${r.network === "BANK" ? r.bankName ?? "" : phone(r.phone ?? "")}`}
                onPress={() => choose(r)}
                leading={<PaymentLogo id={r.network} size={28} />}
              />
            ))}
          </Card>
          <Button title={tr("Nouveau bénéficiaire")} icon="plus" variant="secondary" onPress={() => setAdding(true)} />
        </>
      ) : (
        <>
          {saved.length ? <H2 style={{ fontFamily: fonts.regular, fontSize: 17, marginBottom: 12 }}>{tr("Nouveau bénéficiaire")}</H2> : null}
          <RecipientForm
            country={country}
            networks={corridor.networks}
            submitLabel={tr("Continuer")}
            onSubmit={(r, save) => choose({ ...r, id: "draft" }, save)}
          />
          {saved.length ? <Button title={tr("Choisir un bénéficiaire enregistré")} variant="ghost" onPress={() => setAdding(false)} style={{ marginTop: 6 }} /> : null}
        </>
      )}
    </Screen>
  );
}
