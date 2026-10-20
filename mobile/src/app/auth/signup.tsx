import { Link, router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Checkbox, PasswordChecklist, SelectField } from "@/components/form";
import { Button, Field, H1, Header, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/corridors";
import { ageFrom, maskDate, OCCUPATIONS, parseBirthDate, POSTAL_LABEL, REGION_LABEL, REGIONS } from "@/lib/geo";
import { openSite } from "@/lib/links";
import { passwordScore, useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Pas d'étape « code par SMS » : aucun envoi réel de SMS à l'inscription (la connexion, elle, est
// protégée par un code envoyé par courriel). Étapes 5 à 7 : vérification d'identité (écran /kyc).
const TITLES = [tr("Coordonnées"), tr("Informations personnelles"), tr("Adresse"), tr("Sécurité")];
const LAST = TITLES.length;
const SIGNUP_TOTAL_STEPS = LAST + 3;

export default function SignUp() {
  const { signUp } = useSession();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<CountryCode>("CA");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!region) e.region = `${REGION_LABEL[country]} requis(e)`;
      if (!EMAIL.test(email.trim())) e.email = tr("Adresse courriel invalide");
      if (phone.replace(/\D/g, "").length < 8) e.phone = tr("Numéro de téléphone invalide");
    }
    if (step === 2) {
      if (firstName.trim().length < 2) e.firstName = tr("Prénom requis");
      if (lastName.trim().length < 2) e.lastName = tr("Nom requis");
      const d = parseBirthDate(birth);
      if (!d) e.birth = tr("Date invalide (JJ/MM/AAAA)");
      else if (ageFrom(d) < 18) e.birth = tr("Vous devez avoir au moins 18 ans");
      else if (ageFrom(d) > 120) e.birth = tr("Date invalide");
      if (!occupation) e.occupation = tr("Choisissez une occupation");
    }
    if (step === 3) {
      if (line1.trim().length < 4) e.line1 = tr("Adresse requise");
      if (city.trim().length < 2) e.city = tr("Ville requise");
      if (country === "CA" && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim())) e.postal = tr("Code postal invalide (A1A 1A1)");
      if (country === "CN" && postal && !/^\d{6}$/.test(postal.trim())) e.postal = tr("Code postal à 6 chiffres");
    }
    if (step === 4) {
      if (passwordScore(password) < 4) e.password = tr("Le mot de passe ne respecte pas toutes les règles");
      if (!accepted) e.accepted = tr("Vous devez accepter les conditions");
    }
    return e;
  }

  async function next() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < LAST) return setStep(step + 1);
    setBusy(true);
    const r = await signUp(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
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

  const cta = step === LAST ? tr("Créer mon compte") : tr("Continuer");

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {/* Erreur du serveur (ex. courriel déjà utilisé) au-dessus du bouton : visible sans défiler. */}
          {errors.submit ? <Notice tone="danger" icon="alert" text={errors.submit} /> : null}
          <Button title={tr(cta)} onPress={next} loading={busy} />
          {step === 1 ? (
            <Text style={{ textAlign: "center", color: colors.muted, fontSize: 14 }}>
              {tr("Déjà un compte ?")}{" "}
              <Link href="/auth/login" replace style={{ color: colors.brand, fontFamily: fonts.semibold }}>
                {tr("Se connecter")}
              </Link>
            </Text>
          ) : null}
        </View>
      }
    >
      <Header title={tr("Créer un compte")} onBack={back} />
      <Steps current={step} total={SIGNUP_TOTAL_STEPS} label={tr(TITLES[step - 1])} />

      {step === 1 ? (
        <>
          <H1>{tr("Commençons par vous")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Ces coordonnées servent à vous joindre et à sécuriser vos transferts.")}</P>
          <SelectField
            label={tr("Pays de résidence")}
            value={country}
            options={COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRIES[code].name }))}
            onChange={(v) => {
              setCountry(v as CountryCode);
              setRegion("");
            }}
          />
          <SelectField
            label={tr(REGION_LABEL[country])}
            value={region}
            options={REGIONS[country].map((r) => ({ value: r, label: tr(r) }))}
            onChange={setRegion}
            error={errors.region}
          />
          <Field
            label={tr("Courriel")}
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
            label={tr("Numéro de téléphone")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder={c.phonePlaceholder}
            error={errors.phone}
            hint={tr("Pour vous joindre au sujet de vos transferts.")}
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
          <H1>{tr("Qui êtes-vous ?")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Indiquez vos nom et prénom tels qu'ils figurent sur votre pièce d'identité.")}</P>
          <Field label={tr("Prénom")} value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
          <Field label={tr("Nom")} value={lastName} onChangeText={setLastName} placeholder={tr("Nom de famille")} autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
          <Field
            label={tr("Date de naissance")}
            value={birth}
            onChangeText={(v) => setBirth(maskDate(v))}
            placeholder="JJ/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            error={errors.birth}
          />
          <SelectField label={tr("Profession ou occupation")} value={occupation} options={OCCUPATIONS.map((o) => ({ value: o, label: tr(o) }))} onChange={setOccupation} error={errors.occupation} />
          <Field label={tr("Poste ou domaine (facultatif)")} value={jobTitle} onChangeText={setJobTitle} placeholder={tr("Ex. infirmier, comptable…")} />
          <Notice
            tone="brand"
            icon="info"
            title={tr("Pourquoi ces informations ?")}
            text={tr("La réglementation sur les transferts d'argent nous oblige à vérifier l'identité de nos clients et à connaître leur occupation. Ces données restent confidentielles.")}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <H1>{tr("Où habitez-vous ?")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Votre adresse résidentielle actuelle (pas de case postale).")}</P>
          <Field label={tr("Adresse")} value={line1} onChangeText={setLine1} autoComplete="street-address" error={errors.line1} />
          <Field label={tr("Appartement, bureau (facultatif)")} value={line2} onChangeText={setLine2} placeholder={tr("Ex. app. 804")} />
          <Field label={tr("Ville")} value={city} onChangeText={setCity} autoComplete="postal-address-locality" error={errors.city} />
          <SelectField label={tr(REGION_LABEL[country])} value={region} options={REGIONS[country].map((r) => ({ value: r, label: tr(r) }))} onChange={setRegion} />
          {POSTAL_LABEL[country] ? (
            <Field
              label={country === "CN" ? tr("Code postal (facultatif)") : tr("Code postal")}
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
            <Small>{tr("Pays de résidence : {0}", c.name)}</Small>
          </View>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <H1>{tr("Choisissez un mot de passe")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Il protège votre argent : évitez de réutiliser celui d'un autre service.")}</P>
          <Field
            label={tr("Mot de passe")}
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
              {tr("J'accepte les")}{" "}
              <Text style={{ color: colors.brand }} onPress={() => openSite("/conditions")}>
                {tr("conditions d'utilisation")}
              </Text>{" "}{tr("et la")}{" "}
              <Text style={{ color: colors.brand }} onPress={() => openSite("/confidentialite")}>
                {tr("politique de confidentialité")}
              </Text>{" "}{tr("de PWFINTECH.")}
            </Small>
          </Checkbox>
          {errors.accepted ? <Text style={{ color: colors.danger, fontSize: 13, marginTop: -6, marginBottom: 10 }}>{errors.accepted}</Text> : null}
          <Checkbox checked={marketing} onChange={setMarketing}>
            <Small style={{ color: colors.ink }}>{tr("Recevoir les offres et nouveautés par courriel (facultatif)")}</Small>
          </Checkbox>
        </>
      ) : null}
    </Screen>
  );
}
