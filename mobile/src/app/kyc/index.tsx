import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Button, Card, Choice, H1, Header, ListItem, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { authenticate, biometricKind, biometricLabel } from "@/lib/biometrics";
import { runDiditVerification } from "@/lib/didit";
import { ensureCameraPermission } from "@/lib/camera-permission";
import type { CountryCode } from "@/lib/corridors";
import { KYC_DOCUMENTS } from "@/lib/geo";
import { useSession } from "@/lib/session";
import { colors, fonts, radius } from "@/lib/theme";
import { tr } from "@/lib/i18n";

/**
 * Vérification d'identité (étapes 5 à 7 de l'inscription, qui en compte 7) puis « Compte créé ».
 * Didit branché sur le serveur : pièce d'identité + selfie sur la page sécurisée de Didit, décision
 * automatique (l'appli relit le statut au retour puis toutes les 15 s). Sinon (démo) : capture simulée.
 */
export default function Kyc() {
  const { profile, submitKyc, updateSettings, startDidit, refreshKyc } = useSession();
  // null = on ne sait pas encore si la vérification Didit est branchée.
  const [didit, setDidit] = useState<boolean | null>(null);
  const country = (profile?.country ?? "CA") as CountryCode;
  const docs = KYC_DOCUMENTS[country] ?? KYC_DOCUMENTS.CA;
  const [step, setStep] = useState(profile?.kyc === "none" || profile?.kyc === "rejected" ? 6 : 9);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState(docs[0].id);
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);
  const doc = docs.find((d) => d.id === docId) ?? docs[0];

  // Le parcours (Didit ou déclaration manuelle) n'est choisi qu'avec la réponse du serveur :
  // pendant le chargement ou si le serveur est injoignable, on attend au lieu d'afficher le mauvais parcours.
  const [checkFailed, setCheckFailed] = useState(false);
  const [checkTry, setCheckTry] = useState(0);
  useEffect(() => {
    let alive = true;
    void refreshKyc().then((r) => {
      if (!alive) return;
      if (r.available === null) setCheckFailed(true);
      else setDidit(r.available);
    });
    return () => {
      alive = false;
    };
  }, [refreshKyc, checkTry]);

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
      // Didit pas (ou plus) branché : parcours de démonstration.
      if (r.code === "didit_unavailable") {
        setDidit(false);
        return setStep(7);
      }
      return setError(r.error);
    }
    // Didit (SDK natif sur téléphone, page sécurisée sur le web) ; ensuite, on relit la décision.
    const outcome = await runDiditVerification(r);
    await refreshKyc();
    setBusy(false);
    if (outcome.kind === "failed") return setError(outcome.message);
    if (outcome.kind === "cancelled") return setError(tr("Vérification interrompue. Vous pouvez la reprendre quand vous voulez."));
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

  if (step >= 6 && step <= 8 && didit === null) {
    return (
      <Screen
        footer={
          checkFailed ? (
            <View style={{ gap: 6 }}>
              <Button
                title={tr("Réessayer")}
                onPress={() => {
                  setCheckFailed(false);
                  setCheckTry((n) => n + 1);
                }}
              />
              <Button title={tr("Plus tard")} variant="ghost" onPress={exit} />
            </View>
          ) : undefined
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
        <Steps current={5} total={7} label={tr("Pièce d'identité")} />
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
          <Tip icon="id" text={tr("Photographiez votre pièce : passeport, carte d'identité ou permis de conduire")} />
          <Tip icon="face" text={tr("Prenez un selfie : il est comparé à la photo de la pièce")} />
          <Tip icon="check" text={tr("Réponse en général en quelques minutes")} />
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
        <Steps current={5} total={7} label={tr("Pièce d'identité")} />
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
        <Steps current={6} total={7} label={tr("Photo de la pièce")} />
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
        <Steps current={7} total={7} label={tr("Selfie")} />
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
          tone={verified ? "success" : "warn"}
          icon={verified ? "shield" : "clock"}
          title={verified ? tr("Identité vérifiée") : tr("Identité en cours de vérification")}
          text={verified ? tr("Vous pouvez envoyer de l'argent dès maintenant.") : tr("Généralement quelques minutes. Vous serez prévenu dans l'appli dès qu'elle sera terminée.")}
        />
        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice tone="danger" icon="alert" text={error} />
          </View>
        ) : null}
      </View>
      <Small style={{ fontFamily: fonts.heading, letterSpacing: 0.8, marginTop: 20, marginBottom: 8 }}>{tr("ENSUITE, VOUS POURREZ")}</Small>
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
