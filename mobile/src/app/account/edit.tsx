import { router } from "expo-router";
import { View } from "react-native";
import { useState } from "react";
import { SelectField } from "@/components/form";
import { Button, Field, Header, Notice, Screen } from "@/components/ui";
import type { CountryCode } from "@/lib/corridors";
import { OCCUPATIONS, POSTAL_LABEL, REGION_LABEL, REGIONS } from "@/lib/geo";
import { useSession } from "@/lib/session";
import { tr } from "@/lib/i18n";
import { useSecureScreen } from "@/lib/secure-screen";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EditInfo() {
  useSecureScreen();
  const { profile, update } = useSession();
  const country = (profile?.country ?? "CA") as CountryCode;
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [line1, setLine1] = useState(profile?.address?.line1 ?? "");
  const [line2, setLine2] = useState(profile?.address?.line2 ?? "");
  const [city, setCity] = useState(profile?.address?.city ?? "");
  const [region, setRegion] = useState(profile?.address?.region ?? profile?.region ?? "");
  const [postal, setPostal] = useState(profile?.address?.postalCode ?? "");
  const [occupation, setOccupation] = useState(profile?.occupation ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save() {
    const e: Record<string, string> = {};
    if (!EMAIL.test(email.trim())) e.email = tr("Adresse courriel invalide");
    if (phone.replace(/\D/g, "").length < 8) e.phone = tr("Numéro invalide");
    if (line1.trim().length < 4) e.line1 = tr("Adresse requise");
    if (city.trim().length < 2) e.city = tr("Ville requise");
    if (country === "CA" && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim())) e.postal = tr("Code postal invalide (A1A 1A1)");
    if (country === "CN" && postal.trim() && !/^\d{6}$/.test(postal.trim())) e.postal = tr("Code postal à 6 chiffres");
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await update({
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      region,
      occupation,
      jobTitle: jobTitle.trim() || undefined,
      address: { line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), region, postalCode: postal.trim().toUpperCase() || undefined },
    });
    setBusy(false);
    if (!r.ok) return setErrors({ submit: r.error });
    router.back();
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {/* Dans le pied de page : visible même quand le formulaire est défilé. */}
          {errors.submit ? <Notice tone="danger" icon="alert" text={errors.submit} /> : Object.keys(errors).length ? <Notice tone="danger" icon="alert" text={tr("Corrigez les champs signalés en rouge.")} /> : null}
          <Button title={tr("Enregistrer")} onPress={save} loading={busy} />
        </View>
      }
    >
      <Header title={tr("Modifier mes informations")} />
      <Field label={tr("Courriel")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" hint={tr("Vos codes de connexion sont envoyés à cette adresse.")} error={errors.email} />
      <Field label={tr("Téléphone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
      <Field label={tr("Adresse")} value={line1} onChangeText={setLine1} error={errors.line1} />
      <Field label={tr("Appartement, bureau (facultatif)")} value={line2} onChangeText={setLine2} />
      <Field label={tr("Ville")} value={city} onChangeText={setCity} error={errors.city} />
      <SelectField label={tr(REGION_LABEL[country])} value={region} options={REGIONS[country].map((r) => ({ value: r, label: tr(r) }))} onChange={setRegion} />
      {POSTAL_LABEL[country] ? (
        <Field
          label={country === "CN" ? tr("Code postal (facultatif)") : tr("Code postal")}
          value={postal}
          onChangeText={setPostal}
          placeholder={country === "CA" ? "A1A 1A1" : "100000"}
          autoCapitalize="characters"
          error={errors.postal}
        />
      ) : null}
      <SelectField label={tr("Profession ou occupation")} value={occupation} options={OCCUPATIONS.map((o) => ({ value: o, label: tr(o) }))} onChange={setOccupation} />
      <Field label={tr("Poste ou domaine (facultatif)")} value={jobTitle} onChangeText={setJobTitle} />
    </Screen>
  );
}
