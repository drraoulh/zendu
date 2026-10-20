import { router } from "expo-router";
import { Button, Card, Header, Notice, Screen, SummaryRow } from "@/components/ui";
import { countryName, phone } from "@/lib/format";
import { useSession } from "@/lib/session";
import { tr } from "@/lib/i18n";

export default function Info() {
  const { profile } = useSession();
  if (!profile) return null;
  const a = profile.address;
  const verified = profile.kyc === "verified";

  return (
    <Screen footer={<Button title={tr("Modifier")} variant="secondary" onPress={() => router.push("/account/edit")} />}>
      <Header title={tr("Informations personnelles")} />
      <Notice
        tone={verified ? "success" : "warn"}
        icon="shield"
        title={verified ? tr("Identité vérifiée") : profile.kyc === "pending" ? tr("Vérification en cours") : profile.kyc === "rejected" ? tr("Vérification refusée") : tr("Identité à vérifier")}
        text={
          verified
            ? profile.kycDocument ? tr("Pièce vérifiée : {0}", profile.kycDocument.toLowerCase()) : tr("Votre pièce d'identité a été vérifiée.")
            : profile.kyc === "pending"
              ? tr("Nous vérifions vos documents, généralement en quelques minutes.")
              : tr("Nécessaire avant votre premier transfert.")
        }
      />
      <Card style={{ marginTop: 14, marginBottom: 14 }}>
        <SummaryRow label={tr("Nom légal")} value={`${profile.firstName} ${profile.lastName}`} />
        <SummaryRow label={tr("Date de naissance")} value={profile.birthDate ?? "-"} />
        <SummaryRow label={tr("Courriel")} value={profile.email} />
        <SummaryRow label={tr("Téléphone")} value={phone(profile.phone) || profile.phone} />
        <SummaryRow
          label={tr("Adresse")}
          value={a ? [a.line1, a.line2, a.region ? `${a.city} (${a.region})` : a.city, a.postalCode, countryName(profile.country)].filter(Boolean).join(", ") : countryName(profile.country)}
        />
        <SummaryRow label={tr("Profession")} value={[profile.occupation, profile.jobTitle].filter(Boolean).join(" · ") || "-"} />
      </Card>
      <Notice tone="neutral" icon="info" text={tr("Votre nom légal et votre date de naissance ne peuvent être modifiés qu'en fournissant une nouvelle pièce d'identité valide.")} />
    </Screen>
  );
}
