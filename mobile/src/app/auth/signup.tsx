import { Link, router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Checkbox, PasswordChecklist, SelectField } from "@/components/form";
import { Button, Field, H1, Header, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/corridors";
import { ageFrom, maskDate, OCCUPATIONS, parseBirthDate, POSTAL_LABEL, REGION_LABEL, REGIONS } from "@/lib/geo";
import { company } from "@/lib/company";
import { openSite } from "@/lib/links";
import { storage } from "@/lib/storage";
import { passwordScore, useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Pas d'étape « code par SMS » : aucun envoi réel de SMS à l'inscription (la connexion, elle, est
// protégée par un code envoyé par courriel). Étapes 4 à 6 : vérification d'identité (écran /kyc).
const TITLES = [tr("Vous"), tr("Profil et adresse"), tr("Sécurité")];
const LAST = TITLES.length;
const SIGNUP_TOTAL_STEPS = LAST + 3;
// Brouillon (sans le mot de passe) gardé sur le téléphone : une appli fermée en pleine inscription ne perd rien.
const KEY_DRAFT = "wst.signup.draft";

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
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Le courriel saisi appartient déjà à un compte : on propose de se connecter ou de réinitialiser le mot de passe.
  const [emailTaken, setEmailTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const c = COUNTRIES[country];

  // Reprise du brouillon enregistré (une seule fois), puis sauvegarde à chaque modification.
  const restored = useRef(false);
  useEffect(() => {
    void (async () => {
      const d = await storage.get<Record<string, string>>(KEY_DRAFT);
      if (d) {
        if (d.country && d.country in COUNTRIES) setCountry(d.country as CountryCode);
        setRegion(d.region ?? "");
        setEmail(d.email ?? "");
        setPhone(d.phone ?? "");
        setFirstName(d.firstName ?? "");
        setLastName(d.lastName ?? "");
        setBirth(d.birth ?? "");
        setOccupation(d.occupation ?? "");
        setLine1(d.line1 ?? "");
        setLine2(d.line2 ?? "");
        setCity(d.city ?? "");
        setPostal(d.postal ?? "");
      }
      restored.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    void storage.set(KEY_DRAFT, { country, region, email, phone, firstName, lastName, birth, occupation, line1, line2, city, postal });
  }, [country, region, email, phone, firstName, lastName, birth, occupation, line1, line2, city, postal]);

  /** Numéro sans indicatif ni zéro de tête, même s'il a été collé ou rempli automatiquement avec « +1 », « 237 »… */
  function localPhone(): string {
    let d = phone.replace(/\D/g, "");
    if (phone.trim().startsWith("+") || d.length > 10) {
      if (d.startsWith(c.dialCode)) d = d.slice(c.dialCode.length);
    } else if (c.dialCode === "1" && d.length === 11 && d.startsWith("1")) d = d.slice(1);
    return d.replace(/^0+/, "");
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (firstName.trim().length < 1) e.firstName = tr("Prénom requis");
      if (lastName.trim().length < 1) e.lastName = tr("Nom requis");
      if (!EMAIL.test(email.trim())) e.email = tr("Adresse courriel invalide");
      if (localPhone().length < (country === "CA" ? 10 : 8)) e.phone = tr("Numéro de téléphone invalide");
    }
    if (step === 2) {
      const d = parseBirthDate(birth);
      if (!d) e.birth = tr("Date invalide (JJ/MM/AAAA)");
      else if (ageFrom(d) < 18) e.birth = tr("Vous devez avoir au moins 18 ans");
      else if (ageFrom(d) > 120) e.birth = tr("Date invalide");
      if (!occupation) e.occupation = tr("Choisissez une occupation");
      if (line1.trim().length < 4) e.line1 = tr("Adresse requise");
      if (city.trim().length < 2) e.city = tr("Ville requise");
      if (!region) e.region = `${REGION_LABEL[country]} requis(e)`;
      if (country === "CA" && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim())) e.postal = tr("Code postal invalide (A1A 1A1)");
      if (country === "CN" && postal && !/^\d{6}$/.test(postal.trim())) e.postal = tr("Code postal à 6 chiffres");
    }
    if (step === 3) {
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
        phone: `+${c.dialCode} ${localPhone()}`,
        country,
        region,
        birthDate: birth,
        occupation,
        address: { line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), region, postalCode: postal.trim().toUpperCase() || undefined },
        marketing,
      },
      password,
    );
    setBusy(false);
    if (!r.ok) {
      // Courriel déjà utilisé : on revient à l'étape du courriel pour le corriger (ou se connecter).
      if (r.code === "email_taken") {
        setStep(1);
        setEmailTaken(true);
        return setErrors({ email: tr("Un compte existe déjà avec ce courriel.") });
      }
      return setErrors({ submit: r.error });
    }
    void storage.remove(KEY_DRAFT);
    router.replace("/kyc");
  }

  function back() {
    if (step > 1) setStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/welcome");
  }

  const cta = step === LAST ? tr("Créer mon compte") : tr("Continuer");

  // Le bouton « retour » du téléphone (Android) revient à l'étape précédente au lieu de quitter l'écran,
  // ce qui effaçait tout ce qui avait été saisi.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (step > 1) {
          setStep(step - 1);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [step]),
  );

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          {/* Erreur du serveur (ex. courriel déjà utilisé) au-dessus du bouton : visible sans défiler. */}
          {errors.submit ? <Notice tone="danger" icon="alert" text={errors.submit} /> : null}
          <Button title={tr(cta)} onPress={next} loading={busy} />
          {step === 1 ? (
            <Text style={{ fontFamily: fonts.regular, textAlign: "center", color: colors.muted, fontSize: 14 }}>
              {tr("Déjà un compte ?")}{" "}
              <Link href="/auth/login" replace style={{ color: colors.brand, fontFamily: fonts.semibold }}>
                {tr("Se connecter")}
              </Link>
            </Text>
          ) : null}
        </View>
      }
    >
      {/* iOS : le geste « glisser pour revenir » ne doit pas quitter le formulaire après la 1re étape. */}
      <Stack.Screen options={{ gestureEnabled: step === 1 }} />
      <Header title={tr("Créer un compte")} onBack={back} />
      <Steps current={step} total={SIGNUP_TOTAL_STEPS} label={tr(TITLES[step - 1])} />

      {step === 1 ? (
        <>
          <H1>{tr("Commençons par vous")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Indiquez vos nom et prénom tels qu'ils figurent sur votre pièce d'identité.")}</P>
          <SelectField
            label={tr("Pays de résidence")}
            value={country}
            options={COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRIES[code].name }))}
            onChange={(v) => {
              setCountry(v as CountryCode);
              setRegion("");
            }}
          />
          <Field label={tr("Prénom")} value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
          <Field label={tr("Nom")} value={lastName} onChangeText={setLastName} placeholder={tr("Nom de famille")} autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
          <Field
            label={tr("Courriel")}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailTaken(false);
            }}
            placeholder="nom@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />
          {emailTaken ? (
            <View style={{ gap: 8, marginTop: -4, marginBottom: 16 }}>
              <Notice
                tone="brand"
                title={tr("Vous avez déjà un compte")}
                text={tr("Connectez-vous pour continuer, ou réinitialisez votre mot de passe si vous l'avez oublié. Vos informations saisies ici sont conservées.")}
              />
              <Button title={tr("Se connecter")} size="sm" onPress={() => router.replace({ pathname: "/auth/login", params: { email: email.trim().toLowerCase() } })} />
              <Button title={tr("Mot de passe oublié ?")} size="sm" variant="secondary" onPress={() => router.push({ pathname: "/auth/forgot", params: { email: email.trim().toLowerCase() } })} />
            </View>
          ) : null}
          <Field
            label={tr("Numéro de téléphone")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder={c.phonePlaceholder}
            error={errors.phone}
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
          <H1>{tr("Votre profil et votre adresse")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("La réglementation sur les transferts d'argent nous oblige à vérifier l'identité de nos clients. Ces données restent confidentielles.")}</P>
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
          <Field label={tr("Adresse résidentielle")} value={line1} onChangeText={setLine1} autoComplete="street-address" error={errors.line1} />
          <Field label={tr("Appartement, bureau (facultatif)")} value={line2} onChangeText={setLine2} placeholder={tr("Ex. app. 804")} />
          <Field label={tr("Ville")} value={city} onChangeText={setCity} autoComplete="postal-address-locality" error={errors.city} />
          <SelectField label={tr(REGION_LABEL[country])} value={region} options={REGIONS[country].map((r) => ({ value: r, label: tr(r) }))} onChange={setRegion} error={errors.region} />
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
        </>
      ) : null}

      {step === 3 ? (
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
          {errors.accepted ? <Text style={{ fontFamily: fonts.regular, color: colors.danger, fontSize: 13, marginTop: -6, marginBottom: 10 }}>{errors.accepted}</Text> : null}
          <Checkbox checked={marketing} onChange={setMarketing}>
            <Small style={{ color: colors.ink }}>{tr("Recevoir les offres et nouveautés par courriel (facultatif)")}</Small>
          </Checkbox>
          {company.email ? <Small style={{ marginTop: 6 }}>{tr("Vos données sont chiffrées. Besoin d'aide ? {0}", company.email)}</Small> : null}
        </>
      ) : null}
    </Screen>
  );
}
