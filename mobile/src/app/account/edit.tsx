import { router } from "expo-router";
import { View } from "react-native";
import { useState } from "react";
import { SelectField } from "@/components/form";
import { Button, Field, Header, Notice, Screen } from "@/components/ui";
import type { CountryCode } from "@/lib/corridors";
import { OCCUPATIONS, POSTAL_LABEL, REGION_LABEL, REGIONS } from "@/lib/geo";
import { useSession } from "@/lib/session";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function EditInfo() {
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
    if (!EMAIL.test(email.trim())) e.email = "Adresse courriel invalide";
    if (phone.replace(/\D/g, "").length < 8) e.phone = "Numéro invalide";
    if (line1.trim().length < 4) e.line1 = "Adresse requise";
    if (city.trim().length < 2) e.city = "Ville requise";
    if (country === "CA" && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim())) e.postal = "Code postal invalide (A1A 1A1)";
    if (country === "CN" && postal.trim() && !/^\d{6}$/.test(postal.trim())) e.postal = "Code postal à 6 chiffres";
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
          {errors.submit ? <Notice tone="danger" icon="alert" text={errors.submit} /> : Object.keys(errors).length ? <Notice tone="danger" icon="alert" text="Corrigez les champs signalés en rouge." /> : null}
          <Button title="Enregistrer" onPress={save} loading={busy} />
        </View>
      }
    >
      <Header title="Modifier mes informations" />
      <Field label="Courriel" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
      <Field label="Adresse" value={line1} onChangeText={setLine1} error={errors.line1} />
      <Field label="Appartement, bureau (facultatif)" value={line2} onChangeText={setLine2} />
      <Field label="Ville" value={city} onChangeText={setCity} error={errors.city} />
      <SelectField label={REGION_LABEL[country]} value={region} options={REGIONS[country].map((r) => ({ value: r, label: r }))} onChange={setRegion} />
      {POSTAL_LABEL[country] ? (
        <Field
          label={country === "CN" ? "Code postal (facultatif)" : "Code postal"}
          value={postal}
          onChangeText={setPostal}
          placeholder={country === "CA" ? "A1A 1A1" : "100000"}
          autoCapitalize="characters"
          error={errors.postal}
        />
      ) : null}
      <SelectField label="Profession ou occupation" value={occupation} options={OCCUPATIONS.map((o) => ({ value: o, label: o }))} onChange={setOccupation} />
      <Field label="Poste ou domaine (facultatif)" value={jobTitle} onChangeText={setJobTitle} />
    </Screen>
  );
}
