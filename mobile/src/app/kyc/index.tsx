import { router } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Button, Card, Choice, H1, Header, ListItem, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { authenticate, biometricKind, biometricLabel } from "@/lib/biometrics";
import type { CountryCode } from "@/lib/corridors";
import { KYC_DOCUMENTS } from "@/lib/geo";
import { useSession } from "@/lib/session";
import { colors, fonts, radius } from "@/lib/theme";

/**
 * Vérification d'identité (étapes 6 à 8 de l'inscription) puis « Compte créé ».
 * Démo : la capture est simulée. En production, brancher le SDK du prestataire KYC à cet endroit.
 */
export default function Kyc() {
  const { profile, update, updateSettings } = useSession();
  const country = (profile?.country ?? "CA") as CountryCode;
  const docs = KYC_DOCUMENTS[country] ?? KYC_DOCUMENTS.CA;
  const [step, setStep] = useState(profile?.kyc === "none" ? 6 : 9);
  const [docId, setDocId] = useState(docs[0].id);
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);
  const doc = docs.find((d) => d.id === docId) ?? docs[0];

  async function submit() {
    await update({ kyc: "pending", kycDocument: doc.label });
    setStep(9);
  }

  async function enableBiometric() {
    const kind = await biometricKind();
    if (kind === "none") return setBioMessage("Aucune biométrie configurée sur cet appareil. Vous pourrez l'activer plus tard dans Sécurité.");
    const res = await authenticate(`Activer ${biometricLabel(kind)}`);
    if (!res.ok) return setBioMessage(res.error);
    await updateSettings({ biometric: true });
    router.replace("/(tabs)");
  }

  const exit = () => router.replace("/(tabs)");

  if (step === 6) {
    return (
      <Screen
        footer={
          <View style={{ gap: 6 }}>
            <Button title={`Continuer avec : ${doc.label.toLowerCase()}`} onPress={() => setStep(7)} />
            <Button title="Plus tard" variant="ghost" onPress={exit} />
          </View>
        }
      >
        <Header title="Vérification d'identité" back={false} />
        <Steps current={6} total={8} label="Pièce d'identité" />
        <H1>Vérifions votre identité</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>Exigée par la réglementation sur les transferts d&apos;argent. Cela prend environ 2 minutes.</P>
        <Small style={{ fontFamily: fonts.semibold, color: colors.ink, marginBottom: 8 }}>Choisissez un document valide</Small>
        {docs.map((d) => (
          <Choice key={d.id} icon="id" label={d.label} description={d.description} selected={docId === d.id} onPress={() => setDocId(d.id)} />
        ))}
        <Notice
          tone="brand"
          icon="lock"
          title="Vos données sont chiffrées."
          text="Les photos servent uniquement à vérifier votre identité et ne sont jamais partagées à des fins commerciales."
        />
      </Screen>
    );
  }

  if (step === 7) {
    const ready = front && (!doc.twoSided || back);
    return (
      <Screen footer={<Button title="Continuer" onPress={() => setStep(8)} disabled={!ready} />}>
        <Header title="Photo de la pièce" onBack={() => setStep(6)} />
        <Steps current={7} total={8} label="Photo de la pièce" />
        <H1>{doc.label}</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>Placez la pièce dans le cadre, posée sur une surface sombre.</P>
        <Capture label={doc.twoSided ? "Recto" : "Page photo"} done={front} onPress={() => setFront(true)} />
        {doc.twoSided ? <Capture label="Verso" done={back} onPress={() => setBack(true)} disabled={!front} /> : null}
        <Card style={{ paddingVertical: 6, marginBottom: 14 }}>
          <Tip icon="id" text="Cadrez les 4 coins de la pièce" />
          <Tip icon="eye" text="Bonne lumière, de préférence naturelle" />
          <Tip icon="alert" text="Pas de reflets ni de flou sur le texte" />
        </Card>
        <Notice tone="neutral" icon="info" text="Version de démonstration : la prise de photo est simulée." />
      </Screen>
    );
  }

  if (step === 8) {
    return (
      <Screen footer={<Button title="Envoyer pour vérification" onPress={submit} disabled={!selfie} />}>
        <Header title="Vérification du visage" onBack={() => setStep(7)} />
        <Steps current={8} total={8} label="Selfie" />
        <H1>Prenez un selfie</H1>
        <P style={{ marginTop: 6 }}>Nous comparons votre visage à la photo de votre pièce d&apos;identité.</P>
        <View style={st.selfie}>
          <View style={[st.oval, selfie && { borderColor: colors.success, borderStyle: "solid" }]}>
            <Icon name={selfie ? "check" : "face"} color={selfie ? colors.success : colors.silver} size={64} strokeWidth={1.4} />
          </View>
        </View>
        <Button title={selfie ? "Reprendre le selfie" : "Prendre le selfie"} icon="camera" variant="secondary" onPress={() => setSelfie(true)} />
        <Card style={{ paddingVertical: 6, marginTop: 14 }}>
          <Tip icon="face" text="Centrez votre visage dans l'ovale" />
          <Tip icon="user" text="Retirez lunettes et chapeau, seul(e) dans le cadre" />
          <Tip icon="eye" text="Regardez l'objectif, visage bien éclairé" />
        </Card>
      </Screen>
    );
  }

  const verified = profile?.kyc === "verified";
  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          <Button title="Découvrir l'application" onPress={exit} />
          {Platform.OS === "web" ? null : <Button title="Activer Face ID / empreinte" icon="face" variant="secondary" onPress={enableBiometric} />}
        </View>
      }
    >
      <View style={{ alignItems: "center", paddingTop: 28 }}>
        <View style={[st.heroIcon, { backgroundColor: colors.successSoft }]}>
          <Icon name="check" color={colors.success} size={40} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>Bienvenue sur WorldSoft Transfer</H1>
        <P style={{ textAlign: "center", marginTop: 6 }}>Votre compte est créé, {profile?.firstName}.</P>
      </View>
      <View style={{ marginTop: 18 }}>
        <Notice
          tone={verified ? "success" : "warn"}
          icon={verified ? "shield" : "clock"}
          title={verified ? "Identité vérifiée" : "Identité en cours de vérification"}
          text={verified ? "Vous pouvez envoyer de l'argent dès maintenant." : "Généralement quelques minutes. Nous vous avertirons par notification et courriel."}
        />
      </View>
      <Small style={{ fontFamily: fonts.heading, letterSpacing: 0.8, marginTop: 20, marginBottom: 8 }}>ENSUITE, VOUS POURREZ</Small>
      <Card style={{ paddingVertical: 6 }}>
        <ListItem icon="send" title="Envoyer de l'argent" subtitle="Mobile Money, virement bancaire, retrait" />
        <ListItem icon="user" title="Enregistrer vos destinataires" subtitle="Vos proches, en un geste" />
        <ListItem icon="history" title="Suivre chaque transfert" subtitle="Étapes en temps réel et reçus" />
        <ListItem icon="grid" title="Découvrir PWFINTECH" subtitle="Finances, Technologies et Shipping" />
      </Card>
      {bioMessage ? (
        <View style={{ marginTop: 12 }}>
          <Notice tone="neutral" icon="info" text={bioMessage} />
        </View>
      ) : null}
    </Screen>
  );
}

function Tip({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
      <Icon name={icon} color={colors.brand} size={18} />
      <Small style={{ color: colors.ink, flex: 1 }}>{text}</Small>
    </View>
  );
}

function Capture({ label, done, onPress, disabled = false }: { label: string; done: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <View style={[st.capture, done && { borderColor: colors.success, backgroundColor: colors.successSoft, borderStyle: "solid" }, disabled && { opacity: 0.5 }]}>
      <Icon name={done ? "check" : "id"} color={done ? colors.success : colors.brand} size={30} />
      <Text style={st.captureLabel}>{done ? `${label} · capturé` : label}</Text>
      <Button title={done ? "Reprendre" : "Prendre la photo"} icon="camera" size="sm" variant={done ? "secondary" : "primary"} onPress={onPress} disabled={disabled} />
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
