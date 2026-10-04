import { router } from "expo-router";
import { Button, Card, Header, Notice, Screen, SummaryRow } from "@/components/ui";
import { countryName, phone } from "@/lib/format";
import { useSession } from "@/lib/session";

export default function Info() {
  const { profile } = useSession();
  if (!profile) return null;
  const a = profile.address;
  const verified = profile.kyc === "verified";

  return (
    <Screen footer={<Button title="Modifier" variant="secondary" onPress={() => router.push("/account/edit")} />}>
      <Header title="Informations personnelles" />
      <Notice
        tone={verified ? "success" : "warn"}
        icon="shield"
        title={verified ? "Identité vérifiée" : profile.kyc === "pending" ? "Vérification en cours" : profile.kyc === "rejected" ? "Vérification refusée" : "Identité à vérifier"}
        text={
          verified
            ? `Vérification KYC complétée${profile.kycDocument ? ` · ${profile.kycDocument.toLowerCase()}` : ""}`
            : profile.kyc === "pending"
              ? "Nous vérifions vos documents, généralement en quelques minutes."
              : "Nécessaire avant votre premier transfert."
        }
      />
      <Card style={{ marginTop: 14, marginBottom: 14 }}>
        <SummaryRow label="Nom légal" value={`${profile.firstName} ${profile.lastName}`} />
        <SummaryRow label="Date de naissance" value={profile.birthDate ?? "—"} />
        <SummaryRow label="Courriel" value={profile.email} />
        <SummaryRow label="Téléphone" value={phone(profile.phone) || profile.phone} />
        <SummaryRow
          label="Adresse"
          value={a ? [a.line1, a.line2, `${a.city} (${a.region})`, a.postalCode, countryName(profile.country)].filter(Boolean).join(", ") : countryName(profile.country)}
        />
        <SummaryRow label="Profession" value={[profile.occupation, profile.jobTitle].filter(Boolean).join(" · ") || "—"} />
      </Card>
      <Notice tone="neutral" icon="info" text="Votre nom légal et votre date de naissance ne peuvent être modifiés qu'en fournissant une nouvelle pièce d'identité valide." />
    </Screen>
  );
}
