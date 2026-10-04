import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Icon } from "@/components/icons";
import { Button, Choice, Field, H1, Header, P, Screen, Small, Steps } from "@/components/ui";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignUp() {
  const { signUp } = useSession();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState<CountryCode>("CA");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function next() {
    const e: Record<string, string> = {};
    if (step === 2) {
      if (firstName.trim().length < 2) e.firstName = "Prénom requis";
      if (lastName.trim().length < 2) e.lastName = "Nom requis";
    }
    if (step === 3) {
      if (!EMAIL.test(email.trim())) e.email = "Adresse e-mail invalide";
      if (phone.replace(/\D/g, "").length < 8) e.phone = "Numéro de téléphone invalide";
      if (password.length < 8) e.password = "8 caractères minimum";
      if (!accepted) e.accepted = "Vous devez accepter les conditions";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < 3) return setStep(step + 1);
    void submit();
  }

  async function submit() {
    setBusy(true);
    await signUp({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      phone: `+${COUNTRIES[country].dialCode} ${phone.trim()}`,
      country,
    });
    setBusy(false);
    router.replace("/kyc");
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 10 }}>
          <Button title={step < 3 ? "Continuer" : "Créer mon compte"} onPress={next} loading={busy} />
          {step === 1 ? (
            <Text style={{ textAlign: "center", color: colors.muted, fontSize: 14 }}>
              Déjà inscrit ?{" "}
              <Link href="/auth/login" replace style={{ color: colors.brand, fontFamily: fonts.semibold }}>
                Se connecter
              </Link>
            </Text>
          ) : null}
        </View>
      }
    >
      <Header title="Créer un compte" />
      <Steps current={step} total={3} />

      {step === 1 ? (
        <>
          <H1>Où habitez-vous ?</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Votre pays de résidence détermine la devise de vos envois.</P>
          {COUNTRY_CODES.map((code) => (
            <Choice
              key={code}
              label={COUNTRIES[code].name}
              description={`Vous paierez en ${COUNTRIES[code].currency === "XAF" ? "FCFA" : COUNTRIES[code].currency}`}
              selected={country === code}
              onPress={() => setCountry(code)}
            />
          ))}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <H1>Votre identité</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Indiquez vos nom et prénom tels qu&apos;ils figurent sur votre pièce d&apos;identité.</P>
          <Field label="Prénom" value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
          <Field label="Nom" value={lastName} onChangeText={setLastName} autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <H1>Vos coordonnées</H1>
          <P style={{ marginTop: 6, marginBottom: 18 }}>Pour vous envoyer vos reçus et sécuriser votre compte.</P>
          <Field
            label="Adresse e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />
          <Field
            label="Téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder={COUNTRIES[country].phonePlaceholder}
            error={errors.phone}
            left={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Flag code={country} size={20} />
                <Text style={{ fontFamily: fonts.semibold, color: colors.ink }}>+{COUNTRIES[country].dialCode}</Text>
              </View>
            }
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            hint="8 caractères minimum"
            error={errors.password}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            onPress={() => setAccepted(!accepted)}
            style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 4 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: accepted ? colors.brand : colors.line,
                backgroundColor: accepted ? colors.brand : colors.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {accepted ? <Icon name="check" color={colors.white} size={14} strokeWidth={3} /> : null}
            </View>
            <Small style={{ flex: 1, color: colors.ink }}>
              J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité de PWFINTECH.
            </Small>
          </Pressable>
          {errors.accepted ? <Text style={{ color: colors.danger, fontSize: 13, marginTop: 6 }}>{errors.accepted}</Text> : null}
        </>
      ) : null}
    </Screen>
  );
}
