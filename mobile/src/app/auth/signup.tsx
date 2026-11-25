import { Link, router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Checkbox, PasswordChecklist, SelectField } from "@/components/form";
import { Button, Field, H1, Header, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/corridors";
import { company } from "@/lib/company";
import { openSite } from "@/lib/links";
import { api, ApiError } from "@/lib/api";
import { storage } from "@/lib/storage";
import { passwordScore, useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Inscription courte (3 étapes) : vous → courriel confirmé par un code → mot de passe. Le profil (naissance, adresse)
// et la vérification d'identité se terminent ensuite depuis le bandeau de l'accueil (écran /kyc).
// L'étape du code est sautée si le courriel ne peut pas partir (la confirmation reste alors à faire plus tard).
const TITLES = [tr("Vous"), tr("Courriel"), tr("Sécurité")];
const LAST = TITLES.length;
const SIGNUP_TOTAL_STEPS = LAST;
// Brouillon (sans le mot de passe) gardé sur le téléphone : une appli fermée en pleine inscription ne perd rien.
const KEY_DRAFT = "wst.signup.draft";

export default function SignUp() {
  const { signUp } = useSession();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<CountryCode>("CA");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Le courriel saisi appartient déjà à un compte : on propose de se connecter ou de réinitialiser le mot de passe.
  const [emailTaken, setEmailTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  // Vérification du courriel : défi en cours, code saisi, courriel déjà confirmé, délai avant renvoi.
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [skippedVerify, setSkippedVerify] = useState(false);
  const [wait, setWait] = useState(0);
  const c = COUNTRIES[country];

  // Reprise du brouillon enregistré (une seule fois), puis sauvegarde à chaque modification.
  const restored = useRef(false);
  useEffect(() => {
    void (async () => {
      const d = await storage.get<Record<string, string>>(KEY_DRAFT);
      if (d) {
        if (d.country && d.country in COUNTRIES) setCountry(d.country as CountryCode);
        setEmail(d.email ?? "");
        setPhone(d.phone ?? "");
        setFirstName(d.firstName ?? "");
        setLastName(d.lastName ?? "");
      }
      restored.current = true;
    })();
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    void storage.set(KEY_DRAFT, { country, email, phone, firstName, lastName });
  }, [country, email, phone, firstName, lastName]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const cleanEmail = email.trim().toLowerCase();

  /** Envoie le code (ou le renvoie). Renvoie false si l'envoi échoue ; `required` = confirmation obligatoire. */
  async function sendCode(resend: boolean): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
    try {
      const r = await api.emailCode(cleanEmail, firstName.trim() || "client", resend ? (challenge ?? undefined) : undefined);
      setChallenge(r.challengeId);
      setWait(r.resendAfter);
      setCode("");
      return { ok: true };
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "resend_too_soon") setWait(30);
        return { ok: false, error: e.message, code: e.code };
      }
      return { ok: false, error: tr("Une erreur est survenue.") };
    }
  }

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
      if (code.replace(/\D/g, "").length !== 6) e.code = tr("Entrez le code à 6 chiffres reçu par courriel");
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
    if (step === 1) {
      // Courriel déjà confirmé (retour en arrière) : on passe directement au mot de passe.
      if (verifiedEmail === cleanEmail) return setStep(3);
      setBusy(true);
      const s = await sendCode(false);
      setBusy(false);
      if (s.ok) {
        setSkippedVerify(false);
        return setStep(2);
      }
      if (s.code === "email_taken") {
        setEmailTaken(true);
        return setErrors({ email: tr("Un compte existe déjà avec ce courriel.") });
      }
      if (s.code === "rate_limited") return setErrors({ submit: s.error });
      // Envoi impossible pour le moment : la confirmation n'est pas bloquante, elle se fera plus tard.
      setSkippedVerify(true);
      return setStep(3);
    }
    if (step === 2) {
      if (!challenge) return setStep(1);
      setBusy(true);
      try {
        await api.emailVerify(challenge, code.replace(/\D/g, ""));
        setVerifiedEmail(cleanEmail);
        setBusy(false);
        return setStep(3);
      } catch (err) {
        setBusy(false);
        const m = err instanceof ApiError ? err.message : tr("Une erreur est survenue.");
        if (err instanceof ApiError && (err.code === "expired" || err.code === "too_many")) setCode("");
        return setErrors({ code: m });
      }
    }
    setBusy(true);
    const r = await signUp(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: `+${c.dialCode} ${localPhone()}`,
        country,
        marketing,
        emailProof: verifiedEmail === cleanEmail && challenge ? challenge : undefined,
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
    // Compte créé : on ouvre l'appli ; le bandeau « Vérifiez votre identité » de l'accueil mène à la vérification.
    router.replace("/(tabs)");
  }

  function back() {
    if (step === 3 && (skippedVerify || verifiedEmail === cleanEmail)) setStep(1);
    else if (step > 1) setStep(step - 1);
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
          setStep(step === 3 && (skippedVerify || verifiedEmail === cleanEmail) ? 1 : step - 1);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [step, skippedVerify, verifiedEmail, cleanEmail]),
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
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Quelques informations pour créer votre compte. Le reste se complète ensuite dans l'appli.")}</P>
          <SelectField
            label={tr("Pays de résidence")}
            value={country}
            options={COUNTRY_CODES.map((code) => ({ value: code, label: COUNTRIES[code].name }))}
            onChange={(v) => setCountry(v as CountryCode)}
          />
          <Field label={tr("Prénom")} value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
          <Field label={tr("Nom")} value={lastName} onChangeText={setLastName} placeholder={tr("Nom de famille")} autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
          <Field
            label={tr("Courriel")}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setEmailTaken(false);
              setChallenge(null);
              setVerifiedEmail(null);
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
          <H1>{tr("Confirmez votre courriel")}</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Nous avons envoyé un code à 6 chiffres à {0}. Vérifiez aussi vos courriels indésirables.", cleanEmail)}</P>
          <Field
            label={tr("Code de vérification")}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            placeholder="123456"
            error={errors.code}
          />
          <View style={{ gap: 8, marginTop: 4 }}>
            <Button
              title={wait > 0 ? tr("Renvoyer le code ({0} s)", String(wait)) : tr("Renvoyer le code")}
              size="sm"
              variant="secondary"
              disabled={wait > 0 || busy}
              onPress={async () => {
                setBusy(true);
                const s = await sendCode(true);
                setBusy(false);
                setErrors(s.ok ? {} : { code: s.error });
              }}
            />
            <Button title={tr("Changer de courriel")} size="sm" variant="secondary" onPress={() => setStep(1)} />
          </View>
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
