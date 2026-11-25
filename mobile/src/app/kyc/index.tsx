import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Button, Card, Choice, Field, H1, Header, ListItem, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { SelectField } from "@/components/form";
import { authenticate, biometricKind, biometricLabel } from "@/lib/biometrics";
import { runDiditVerification } from "@/lib/didit";
import { ensureCameraPermission } from "@/lib/camera-permission";
import type { CountryCode } from "@/lib/corridors";
import { ageFrom, KYC_DOCUMENTS, maskDate, OCCUPATIONS, parseBirthDate, POSTAL_LABEL, REGION_LABEL, REGIONS } from "@/lib/geo";
import { useSession } from "@/lib/session";
import { colors, fonts, radius } from "@/lib/theme";
import { tr } from "@/lib/i18n";

/**
 * Vérification d'identité (étapes 5 à 7 de l'inscription, qui en compte 7) puis « Compte créé ».
 * Didit branché sur le serveur : pièce d'identité + selfie sur la page sécurisée de Didit, décision
 * automatique (l'appli relit le statut au retour puis toutes les 15 s). Sinon (démo) : capture simulée.
 */
export default function Kyc() {
  const { profile, submitKyc, updateSettings, startDidit, refreshKyc, update } = useSession();
  // null = on ne sait pas encore si la vérification Didit est branchée.
  const [didit, setDidit] = useState<boolean | null>(null);
  const country = (profile?.country ?? "CA") as CountryCode;
  const docs = KYC_DOCUMENTS[country] ?? KYC_DOCUMENTS.CA;
  // Profil à compléter (naissance, adresse) : demandé ici, après la création du compte, avant la vérification.
  const profileDone = Boolean(profile?.birthDate && profile?.address?.line1);
  const [stepState, setStep] = useState(profile?.kyc === "none" || profile?.kyc === "rejected" ? (profileDone ? 6 : 5) : 9);
  const [birth, setBirth] = useState(profile?.birthDate ?? "");
  const [occupation, setOccupation] = useState(profile?.occupation ?? "");
  const [line1, setLine1] = useState(profile?.address?.line1 ?? "");
  const [line2, setLine2] = useState(profile?.address?.line2 ?? "");
  const [city, setCity] = useState(profile?.address?.city ?? "");
  const [region, setRegion] = useState(profile?.region ?? profile?.address?.region ?? "");
  const [postal, setPostal] = useState(profile?.address?.postalCode ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState(docs[0].id);
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);
  const doc = docs.find((d) => d.id === docId) ?? docs[0];
  const kycStatus = profile?.kyc;
  // L'écran suit le profil : dès que l'identité est vérifiée (décision reçue, retour au premier plan), on affiche
  // le résultat au lieu de rester sur l'étape choisie à l'ouverture.
  const step = kycStatus === "verified" ? 9 : stepState;

  // Le parcours (Didit ou déclaration manuelle) n'est choisi qu'avec la réponse du serveur :
  // pendant le chargement ou si le serveur est injoignable, on attend au lieu d'afficher le mauvais parcours.
  const [checkFailed, setCheckFailed] = useState(false);
  const [checkTry, setCheckTry] = useState(0);
  // `refreshKyc` change d'identité à chaque mise à jour du profil : s'en servir comme dépendance relançait la
  // requête en boucle (et ignorait chaque réponse), d'où l'écran bloqué sur « Préparation… ». On la garde dans
  // une référence (celle du premier affichage suffit) et on ne relance que sur « Réessayer ».
  const refreshKycRef = useRef(refreshKyc);
  useEffect(() => {
    let alive = true;
    void refreshKycRef.current().then((r) => {
      if (!alive) return;
      if (r.available === null) setCheckFailed(true);
      else setDidit(r.available);
    });
    return () => {
      alive = false;
    };
  }, [checkTry]);

  // Jamais bloqué sur « Préparation… » : sans réponse du serveur au bout de 15 s, on propose de réessayer ou de quitter.
  useEffect(() => {
    if (didit !== null || checkFailed) return;
    const t = setTimeout(() => setCheckFailed(true), 15_000);
    return () => clearTimeout(t);
  }, [didit, checkFailed, checkTry]);

  async function saveProfileStep() {
    const e: Record<string, string> = {};
    const d = parseBirthDate(birth);
    if (!d) e.birth = tr("Date invalide (JJ/MM/AAAA)");
    else if (ageFrom(d) < 18) e.birth = tr("Vous devez avoir au moins 18 ans");
    else if (ageFrom(d) > 120) e.birth = tr("Date invalide");
    if (!occupation) e.occupation = tr("Choisissez une occupation");
    if (line1.trim().length < 4) e.line1 = tr("Adresse requise");
    if (city.trim().length < 2) e.city = tr("Ville requise");
    if (!region) e.region = tr("{0} requis(e)", tr(REGION_LABEL[country]));
    if (country === "CA" && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postal.trim())) e.postal = tr("Code postal invalide (A1A 1A1)");
    if (country === "CN" && postal && !/^\d{6}$/.test(postal.trim())) e.postal = tr("Code postal à 6 chiffres");
    setFieldErrors(e);
    setError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    const r = await update({
      birthDate: birth,
      occupation,
      region,
      address: { line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), region, postalCode: postal.trim().toUpperCase() || undefined },
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setStep(6);
  }

  async function verifyWithDidit() {
    setError(null);
    // Sans l'appareil photo, Didit ne peut ni photographier la pièce ni faire le selfie.
    if (!(await ensureCameraPermission(tr("WorldSoft Transfer a besoin de l'appareil photo pour photographier votre pièce d'identité et faire le selfie.")))) {
      return setError(tr("Autorisez l'appareil photo pour vérifier votre identité."));
    }
    setBusy(true);
    const r = await startDidit();
    if (!r.ok) {
      setBusy(false);
      // Identité déjà vérifiée entre-temps : on affiche simplement le résultat.
      if (r.code === "already_verified") return setStep(9);
      // Didit pas (ou plus) branché : parcours de démonstration.
      if (r.code === "didit_unavailable") {
        setDidit(false);
        return setStep(7);
      }
      return setError(r.error);
    }
    // Didit (SDK natif sur téléphone, page sécurisée sur le web) ; ensuite, on relit la décision.
    const outcome = await runDiditVerification(r);
    const { status } = await refreshKyc();
    setBusy(false);
    if (outcome.kind === "failed") return setError(outcome.message);
    // Refus déjà rendu : on reste sur cet écran, avec le motif, pour recommencer.
    if (status === "rejected") return setStep(6);
    if (outcome.kind === "cancelled") {
      setError(tr("Vérification interrompue. Vous pouvez la reprendre quand vous voulez."));
      return setStep(9);
    }
    setStep(9);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const r = await submitKyc(doc.label);
    setBusy(false);
    if (!r.ok) {
      // Le serveur exige la vérification en ligne : on bascule sur Didit.
      if (r.code === "use_didit") {
        setDidit(true);
        return setStep(6);
      }
      return setError(r.error);
    }
    setStep(9);
  }

  async function enableBiometric() {
    const kind = await biometricKind();
    if (kind === "none") return setBioMessage(tr("Aucune biométrie configurée sur cet appareil. Vous pourrez l'activer plus tard dans Sécurité."));
    const res = await authenticate(tr("Activer {0}", biometricLabel(kind)));
    if (!res.ok) return setBioMessage(res.error);
    await updateSettings({ biometric: true });
    router.dismissTo("/(tabs)");
  }

  const exit = () => router.dismissTo("/(tabs)");

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step === 8) setStep(7);
      else if (step === 7) setStep(6);
      else router.dismissTo("/(tabs)");
      return true;
    });
    return () => sub.remove();
  }, [step]);

  if (step === 5) {
    return (
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
            <Button title={tr("Continuer")} onPress={saveProfileStep} loading={busy} />
            <Button title={tr("Plus tard")} variant="ghost" onPress={exit} disabled={busy} />
          </View>
        }
      >
        <Header title={tr("Terminer mon inscription")} back={false} />
        <Steps current={1} total={2} label={tr("Votre profil")} />
        <H1>{tr("Votre profil et votre adresse")}</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("La réglementation sur les transferts d'argent nous oblige à vérifier l'identité de nos clients. Ces données restent confidentielles.")}</P>
        <Field label={tr("Date de naissance")} value={birth} onChangeText={(v) => setBirth(maskDate(v))} placeholder="JJ/MM/AAAA" keyboardType="number-pad" maxLength={10} error={fieldErrors.birth} />
        <SelectField label={tr("Profession ou occupation")} value={occupation} options={OCCUPATIONS.map((o) => ({ value: o, label: tr(o) }))} onChange={setOccupation} error={fieldErrors.occupation} />
        <Field label={tr("Adresse résidentielle")} value={line1} onChangeText={setLine1} autoComplete="street-address" error={fieldErrors.line1} />
        <Field label={tr("Appartement, bureau (facultatif)")} value={line2} onChangeText={setLine2} placeholder={tr("Ex. app. 804")} />
        <Field label={tr("Ville")} value={city} onChangeText={setCity} autoComplete="postal-address-locality" error={fieldErrors.city} />
        <SelectField label={tr(REGION_LABEL[country])} value={region} options={REGIONS[country].map((r) => ({ value: r, label: tr(r) }))} onChange={setRegion} error={fieldErrors.region} />
        {POSTAL_LABEL[country] ? (
          <Field
            label={country === "CN" ? tr("Code postal (facultatif)") : tr("Code postal")}
            value={postal}
            onChangeText={setPostal}
            placeholder={country === "CA" ? "A1A 1A1" : "100000"}
            autoCapitalize="characters"
            autoComplete="postal-code"
            error={fieldErrors.postal}
          />
        ) : null}
      </Screen>
    );
  }

  if (step >= 6 && step <= 8 && didit === null) {
    return (
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            {checkFailed ? (
              <Button
                title={tr("Réessayer")}
                onPress={() => {
                  setCheckFailed(false);
                  setCheckTry((n) => n + 1);
                }}
              />
            ) : null}
            <Button title={tr("Plus tard")} variant="ghost" onPress={exit} />
          </View>
        }
      >
        <Header title={tr("Vérification d'identité")} back={false} />
        <View style={{ alignItems: "center", gap: 14, paddingVertical: 48 }}>
          {checkFailed ? (
            <Notice tone="danger" icon="alert" text={tr("Connexion au serveur impossible. Vérifiez votre connexion internet puis réessayez.")} />
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.brand} />
              <P>{tr("Préparation de la vérification…")}</P>
            </>
          )}
        </View>
      </Screen>
    );
  }

  if (step === 6 && didit) {
    return (
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            <Button title={tr("Commencer la vérification")} icon="camera" onPress={verifyWithDidit} loading={busy} />
            <Button title={tr("Plus tard")} variant="ghost" onPress={exit} disabled={busy} />
          </View>
        }
      >
        <Header title={tr("Vérification d'identité")} back={false} />
        <Steps current={2} total={2} label={tr("Pièce d'identité")} />
        <H1>{tr("Vérifions votre identité")}</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Exigée par la réglementation sur les transferts d'argent. Cela prend environ 2 minutes.")}</P>
        {profile?.kyc === "rejected" ? (
          <View style={{ marginBottom: 14 }}>
            <Notice
              tone="danger"
              icon="alert"
              title={tr("Votre précédente vérification a été refusée")}
              text={profile.kycNote ? `${profile.kycNote}` : tr("Recommencez avec un document valide et lisible.")}
            />
          </View>
        ) : null}
        <Card style={{ paddingVertical: 6, marginBottom: 14 }}>
          <Tip icon="id" text={tr("Ayez votre pièce originale sous la main : passeport, carte d'identité ou permis de conduire")} />
          <Tip icon="camera" text={tr("Choisissez un endroit bien éclairé, sans reflet sur la pièce")} />
          <Tip icon="face" text={tr("Pour le selfie : visage découvert, sans lunettes ni casquette")} />
          <Tip icon="clock" text={tr("Environ 2 minutes, réponse en général en quelques minutes")} />
        </Card>
        <Notice
          tone="brand"
          icon="lock"
          title={tr("Vérification sécurisée par Didit")}
          text={tr("La vérification se fait sur la page sécurisée de notre prestataire. Revenez ensuite dans l'appli : votre statut se met à jour tout seul.")}
        />
        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice tone="danger" icon="alert" text={error} />
          </View>
        ) : null}
      </Screen>
    );
  }

  if (step === 6) {
    return (
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            <Button title={tr("Continuer avec : {0}", doc.label.toLowerCase())} onPress={() => setStep(7)} />
            <Button title={tr("Plus tard")} variant="ghost" onPress={exit} />
          </View>
        }
      >
        <Header title={tr("Vérification d'identité")} back={false} />
        <Steps current={4} total={6} label={tr("Pièce d'identité")} />
        <H1>{tr("Vérifions votre identité")}</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Exigée par la réglementation sur les transferts d'argent. Cela prend environ 2 minutes.")}</P>
        {profile?.kyc === "rejected" ? (
          <View style={{ marginBottom: 14 }}>
            <Notice
              tone="danger"
              icon="alert"
              title={tr("Votre précédente vérification a été refusée")}
              text={profile.kycNote ? tr("Motif : {0}. Recommencez avec un document valide.", tr(profile.kycNote)) : tr("Recommencez avec un document valide et lisible.")}
            />
          </View>
        ) : null}
        <Small style={{ fontFamily: fonts.semibold, color: colors.ink, marginBottom: 8 }}>{tr("Choisissez un document valide")}</Small>
        {docs.map((d) => (
          <Choice key={d.id} icon="id" label={tr(d.label)} description={tr(d.description)} selected={docId === d.id} onPress={() => setDocId(d.id)} />
        ))}
        <Notice
          tone="brand"
          icon="lock"
          title={tr("Vos données sont chiffrées.")}
          text={tr("Les photos servent uniquement à vérifier votre identité et ne sont jamais partagées à des fins commerciales.")}
        />
      </Screen>
    );
  }

  if (step === 7) {
    const ready = front && (!doc.twoSided || back);
    return (
      <Screen footer={<Button title={tr("Continuer")} onPress={() => setStep(8)} disabled={!ready} />}>
        <Header title={tr("Photo de la pièce")} onBack={() => setStep(6)} />
        <Steps current={5} total={6} label={tr("Photo de la pièce")} />
        <H1>{tr(doc.label)}</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>{tr("Placez la pièce dans le cadre, posée sur une surface sombre.")}</P>
        <Capture label={doc.twoSided ? tr("Recto") : tr("Page photo")} done={front} onPress={() => setFront(true)} />
        {doc.twoSided ? <Capture label={tr("Verso")} done={back} onPress={() => setBack(true)} disabled={!front} /> : null}
        <Card style={{ paddingVertical: 6, marginBottom: 14 }}>
          <Tip icon="id" text={tr("Cadrez les 4 coins de la pièce")} />
          <Tip icon="eye" text={tr("Bonne lumière, de préférence naturelle")} />
          <Tip icon="alert" text={tr("Pas de reflets ni de flou sur le texte")} />
        </Card>
        <Notice tone="neutral" icon="info" text={tr("Version de démonstration : la prise de photo est simulée.")} />
      </Screen>
    );
  }

  if (step === 8) {
    return (
      <Screen footer={<Button title={tr("Envoyer pour vérification")} onPress={submit} disabled={!selfie} loading={busy} />}>
        <Header title={tr("Vérification du visage")} onBack={() => setStep(7)} />
        <Steps current={6} total={6} label={tr("Selfie")} />
        <H1>{tr("Prenez un selfie")}</H1>
        <P style={{ marginTop: 6 }}>{tr("Nous comparons votre visage à la photo de votre pièce d'identité.")}</P>
        <View style={st.selfie}>
          <View style={[st.oval, selfie && { borderColor: colors.success, borderStyle: "solid" }]}>
            <Icon name={selfie ? "check" : "face"} color={selfie ? colors.success : colors.silver} size={64} strokeWidth={1.4} />
          </View>
        </View>
        <Button title={selfie ? tr("Reprendre le selfie") : tr("Prendre le selfie")} icon="camera" variant="secondary" onPress={() => setSelfie(true)} />
        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice tone="danger" icon="alert" text={error} />
          </View>
        ) : null}
        <Card style={{ paddingVertical: 6, marginTop: 14 }}>
          <Tip icon="face" text={tr("Centrez votre visage dans l'ovale")} />
          <Tip icon="user" text={tr("Retirez lunettes et chapeau, seul(e) dans le cadre")} />
          <Tip icon="eye" text={tr("Regardez l'objectif, visage bien éclairé")} />
        </Card>
      </Screen>
    );
  }

  const verified = profile?.kyc === "verified";
  const refused = profile?.kyc === "rejected";
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title={tr("Découvrir l'application")} onPress={exit} />
          {didit && !verified ? (
            <Button title={tr("Reprendre la vérification")} variant="ghost" onPress={verifyWithDidit} loading={busy} />
          ) : null}
          {Platform.OS === "web" ? null : <Button title={tr("Activer Face ID / empreinte")} icon="face" variant="secondary" onPress={enableBiometric} />}
        </View>
      }
    >
      <View style={{ alignItems: "center", paddingTop: 28 }}>
        <View style={[st.heroIcon, { backgroundColor: colors.successSoft }]}>
          <Icon name="check" color={colors.success} size={40} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>{tr("Bienvenue sur WorldSoft Transfer")}</H1>
        <P style={{ textAlign: "center", marginTop: 6 }}>{tr("Votre compte est créé, {0}.", profile?.firstName)}</P>
      </View>
      <View style={{ marginTop: 18 }}>
        <Notice
          tone={verified ? "success" : refused ? "danger" : "warn"}
          icon={verified ? "shield" : refused ? "alert" : "clock"}
          title={verified ? tr("Identité vérifiée") : refused ? tr("Votre précédente vérification a été refusée") : tr("Identité en cours de vérification")}
          text={
            verified
              ? tr("Vous pouvez envoyer de l'argent dès maintenant.")
              : refused
                ? profile?.kycNote ?? tr("Recommencez avec un document valide et lisible.")
                : tr("Généralement quelques minutes. Vous serez prévenu dans l'appli dès qu'elle sera terminée.")
          }
        />
        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice tone="danger" icon="alert" text={error} />
          </View>
        ) : null}
      </View>
      <Small style={{ fontFamily: fonts.heading, letterSpacing: 0, marginTop: 20, marginBottom: 8 }}>{tr("Ensuite, vous pourrez")}</Small>
      <Card style={{ paddingVertical: 6 }}>
        <ListItem icon="send" title={tr("Envoyer de l'argent")} subtitle={tr("Mobile Money, virement bancaire, Interac, Alipay, WeChat Pay")} />
        <ListItem icon="user" title={tr("Enregistrer vos destinataires")} subtitle={tr("Vos proches, en un geste")} />
        <ListItem icon="history" title={tr("Suivre chaque transfert")} subtitle={tr("Étapes en temps réel et reçus")} />
        <ListItem icon="ship" title={tr("Suivre vos colis")} subtitle={tr("Avec le numéro indiqué sur votre reçu d'expédition")} />
      </Card>
      {bioMessage ? (
        <View style={{ marginTop: 12 }}>
          <Notice tone="neutral" icon="info" text={tr(bioMessage)} />
        </View>
      ) : null}
    </Screen>
  );
}

function Tip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
      <Icon name={icon} color={colors.brand} size={18} />
      <Small style={{ color: colors.ink, flex: 1 }}>{tr(text)}</Small>
    </View>
  );
}

function Capture({ label, done, onPress, disabled = false }: { label: string; done: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <View style={[st.capture, done && { borderColor: colors.success, backgroundColor: colors.successSoft, borderStyle: "solid" }, disabled && { opacity: 0.5 }]}>
      <Icon name={done ? "check" : "id"} color={done ? colors.success : colors.brand} size={30} />
      <Text style={st.captureLabel}>{done ? tr("{0} · photo prise", tr(label)) : label}</Text>
      <Button title={done ? tr("Reprendre") : tr("Prendre la photo")} icon="camera" size="sm" variant={done ? "secondary" : "primary"} onPress={onPress} disabled={disabled} />
    </View>
  );
}

const st = StyleSheet.create({
  heroIcon: { width: 84, height: 84, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  capture: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.silver, borderRadius: radius.lg, padding: 18, alignItems: "center", gap: 10, marginBottom: 12, backgroundColor: colors.white },
  captureLabel: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink },
  selfie: { alignItems: "center", marginVertical: 18 },
  oval: { width: 190, height: 240, borderRadius: 120, borderWidth: 3, borderStyle: "dashed", borderColor: colors.brand, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
});
