import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Checkbox, OtpInput, PasswordChecklist, SelectField } from "@/components/form";
import { Button, Field, H1, Header, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/corridors";
import { ageFrom, maskDate, OCCUPATIONS, parseBirthDate, POSTAL_LABEL, REGION_LABEL, REGIONS } from "@/lib/geo";
import { openSite } from "@/lib/links";
import { passwordScore, useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TITLES = ["Coordonnées", "Vérification du téléphone", "Informations personnelles", "Adresse", "Sécurité"];

export default function SignUp() {
  const { signUp } = useSession();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<CountryCode>("CA");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(45);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birth, setBirth] = useState("");
  const [occupation, setOccupation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const c = COUNTRIES[country];

  useEffect(() => {
    if (step !== 2 || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!region) e.region = `${REGION_LABEL[country]} requis(e)`;
      if (!EMAIL.test(email.trim())) e.email = "Adresse courriel invalide";
      if (phone.replace(/\D/g, "").length < 8) e.phone = "Numéro de téléphone invalide";
    }
    if (step === 2 && code.length < 4) e.code = "Saisissez les 4 chiffres reçus";
    if (step === 3) {
      if (firstName.trim().length < 2) e.firstName = "Prénom requis";
      if (lastName.trim().length < 2) e.lastName = "Nom requis";
      const d = parseBirthDate(birth);
      if (!d) e.birth = "Date invalide (JJ/MM/AAAA)";
      else if (ageFrom(d) < 18) e.birth = "Vous devez avoir au moins 18 ans";
      else if (ageFrom(d) > 120) e.birth = "Date invalide";
      if (!occupation) e.occupation = "Choisissez une occupation";
    }
    if (step === 4) {
      if (line1.trim().length < 4) e.line1 = "Adresse requise";
      if (city.trim().length < 2) e.city = "Ville requise";
      if (country === "CA" && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim())) e.postal = "Code postal invalide (A1A 1A1)";
      if (country === "CN" && postal && !/^\d{6}$/.test(postal.trim())) e.postal = "Code postal à 6 chiffres";
    }
    if (step === 5) {
      if (passwordScore(password) < 4) e.password = "Le mot de passe ne respecte pas toutes les règles";
      if (!accepted) e.accepted = "Vous devez accepter les conditions";
    }
    return e;
  }

  async function next() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 5) {
      if (step === 1) {
        setCode("");
        setCountdown(45);
      }
      return setStep(step + 1);
    }
    setBusy(true);
    const r = await signUp(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        phone: `+${c.dialCode} ${phone.trim()}`,
        country,
        region,
        birthDate: birth,
        occupation,
        jobTitle: jobTitle.trim() || undefined,
        address: { line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), region, postalCode: postal.trim().toUpperCase() || undefined },
        marketing,
      },
      password,
    );
    setBusy(false);
    if (!r.ok) return setErrors({ submit: r.error });
    router.replace("/kyc");
  }

  function back() {
    if (step > 1) setStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/welcome");
  }

  const cta = step === 2 ? "Vérifier" : step === 5 ? "Créer mon compte" : "Continuer";

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <Button title={cta} onPress={next} loading={busy} />
          {step === 1 ? (
            <Text style={{ textAlign: "center", color: colors.muted, fontSize: 14 }}>
              Déjà un compte ?{" "}
              <Link href="/auth/login" replace style={{ color: colors.brand, fontFamily: fonts.semibold }}>
                Se connecter
              </Link>
            </Text>
          ) : null}
        </View>
      }
    >
      <Header title="Créer un compte" onBack={back} />
      <Steps current={step} total={8} label={TITLES[step - 1]} />

      {step === 1 ? (
        <>
          <H1>Commençons par vous</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Ces coordonnées servent à vous joindre et à sécuriser vos transferts.</P>
          <SelectField
            label="Pays de résidence"
            value={country}
            options={COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRIES[code].name }))}
            onChange={(v) => {
              setCountry(v as CountryCode);
              setRegion("");
            }}
          />
          <SelectField
            label={REGION_LABEL[country]}
            value={region}
            options={REGIONS[country].map((r) => ({ value: r, label: r }))}
            onChange={setRegion}
            error={errors.region}
          />
          <Field
            label="Courriel"
            value={email}
            onChangeText={setEmail}
            placeholder="nom@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />
          <Field
            label="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder={c.phonePlaceholder}
            error={errors.phone}
            hint="Nous vous enverrons un code par texto pour confirmer ce numéro."
            left={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Flag code={country} size={20} />
                <Text style={{ fontFamily: fonts.semibold, color: colors.ink }}>+{c.dialCode}</Text>
              </View>
            }
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <H1>Entrez le code reçu</H1>
          <P style={{ marginTop: 6 }}>
            Code envoyé au +{c.dialCode} •••• {phone.replace(/\D/g, "").slice(-2)}. Il expire dans 10 minutes.
          </P>
          <OtpInput length={4} value={code} onChange={setCode} />
          {errors.code ? <Text style={{ color: colors.danger, textAlign: "center", marginBottom: 8 }}>{errors.code}</Text> : null}
          <View style={{ alignItems: "center", gap: 10, marginBottom: 16 }}>
            {countdown > 0 ? (
              <Small>Renvoyer le code dans 0:{String(countdown).padStart(2, "0")}</Small>
            ) : (
              <Button title="Renvoyer le code" variant="ghost" size="sm" onPress={() => setCountdown(45)} />
            )}
            <Button title="Modifier le numéro" variant="ghost" size="sm" onPress={() => setStep(1)} />
          </View>
          <Notice
            tone="neutral"
            icon="info"
            text="Version de démonstration : aucun SMS n'est envoyé, saisissez 4 chiffres au choix. Vous ne recevez rien en production ? Vérifiez que le numéro peut recevoir des textos."
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <H1>Qui êtes-vous ?</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Indiquez vos nom et prénom tels qu&apos;ils figurent sur votre pièce d&apos;identité.</P>
          <Field label="Prénom" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
          <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Nom de famille" autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
          <Field
            label="Date de naissance"
            value={birth}
            onChangeText={(v) => setBirth(maskDate(v))}
            placeholder="JJ/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            error={errors.birth}
          />
          <SelectField label="Profession ou occupation" value={occupation} options={OCCUPATIONS.map((o) => ({ value: o, label: o }))} onChange={setOccupation} error={errors.occupation} />
          <Field label="Poste ou domaine (facultatif)" value={jobTitle} onChangeText={setJobTitle} placeholder="Ex. infirmier, comptable…" />
          <Notice
            tone="brand"
            icon="info"
            title="Pourquoi ces informations ?"
            text="La réglementation sur les transferts d'argent nous oblige à vérifier l'identité de nos clients et à connaître leur occupation. Ces données restent confidentielles."
          />
        </>
      ) : null}

      {step === 4 ? (
        <>
          <H1>Où habitez-vous ?</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Votre adresse résidentielle actuelle (pas de case postale).</P>
          <Field label="Adresse" value={line1} onChangeText={setLine1} autoComplete="street-address" error={errors.line1} />
          <Field label="Appartement, bureau (facultatif)" value={line2} onChangeText={setLine2} placeholder="Ex. app. 804" />
          <Field label="Ville" value={city} onChangeText={setCity} autoComplete="postal-address-locality" error={errors.city} />
          <SelectField label={REGION_LABEL[country]} value={region} options={REGIONS[country].map((r) => ({ value: r, label: r }))} onChange={setRegion} />
          {POSTAL_LABEL[country] ? (
            <Field
              label={country === "CN" ? "Code postal (facultatif)" : "Code postal"}
              value={postal}
              onChangeText={setPostal}
              placeholder={country === "CA" ? "A1A 1A1" : "100000"}
              autoCapitalize="characters"
              autoComplete="postal-code"
              error={errors.postal}
            />
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Flag code={country} size={22} />
            <Small>Pays de résidence : {c.name}</Small>
          </View>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <H1>Choisissez un mot de passe</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Il protège votre argent : évitez de réutiliser celui d&apos;un autre service.</P>
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
          />
          <PasswordChecklist value={password} />
          <Checkbox checked={accepted} onChange={setAccepted}>
            <Small style={{ color: colors.ink }}>
              J&apos;accepte les{" "}
              <Text style={{ color: colors.brand }} onPress={() => openSite("/conditions")}>
                conditions d&apos;utilisation
              </Text>{" "}
              et la{" "}
              <Text style={{ color: colors.brand }} onPress={() => openSite("/confidentialite")}>
                politique de confidentialité
              </Text>{" "}
              de PWFINTECH.
            </Small>
          </Checkbox>
          {errors.accepted ? <Text style={{ color: colors.danger, fontSize: 13, marginTop: -6, marginBottom: 10 }}>{errors.accepted}</Text> : null}
          <Checkbox checked={marketing} onChange={setMarketing}>
            <Small style={{ color: colors.ink }}>Recevoir les offres et nouveautés par courriel (facultatif)</Small>
          </Checkbox>
          {errors.submit ? <Notice tone="danger" icon="alert" text={errors.submit} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
