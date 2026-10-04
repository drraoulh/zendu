import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { Button, Card, Choice, H1, Header, ListItem, Notice, P, Screen, Small, Steps } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors, fonts, radius } from "@/lib/theme";

type Doc = "passport" | "id_card" | "permit";

const DOCS: { id: Doc; label: string; description: string }[] = [
  { id: "passport", label: "Passeport", description: "Page avec photo" },
  { id: "id_card", label: "Carte d'identité", description: "Recto et verso" },
  { id: "permit", label: "Titre de séjour / permis", description: "Recto et verso" },
];

/**
 * Vérification d'identité (KYC).
 * Démo : la capture est simulée. En production, brancher un prestataire KYC (SDK natif) à cet endroit.
 */
export default function Kyc() {
  const { profile, update } = useSession();
  const [step, setStep] = useState(0);
  const [doc, setDoc] = useState<Doc>("passport");
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [selfie, setSelfie] = useState(false);
  const needsBack = doc !== "passport";

  async function finish() {
    await update({ kyc: "verified" });
    router.replace("/(tabs)");
  }

  async function later() {
    router.replace("/(tabs)");
  }

  if (step === 0) {
    return (
      <Screen
        footer={
          <View style={{ gap: 10 }}>
            <Button title="Commencer la vérification" onPress={() => setStep(1)} />
            <Button title="Plus tard" variant="ghost" onPress={later} />
          </View>
        }
      >
        <Header back={false} />
        <View style={st.heroIcon}>
          <Icon name="shield" color={colors.brand} size={34} />
        </View>
        <H1>Vérifions votre identité, {profile?.firstName ?? ""}</H1>
        <P style={{ marginTop: 8, marginBottom: 18 }}>
          La réglementation nous oblige à vérifier l&apos;identité de chaque client avant son premier transfert. Comptez 3 minutes.
        </P>
        <Card style={{ paddingVertical: 6 }}>
          <Item icon="id" title="Une pièce d'identité valide" text="Passeport, carte d'identité ou titre de séjour" />
          <Item icon="face" title="Un selfie" text="Pour confirmer que c'est bien vous" />
          <Item icon="lock" title="Données chiffrées" text="Utilisées uniquement pour la vérification" />
        </Card>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen footer={<Button title="Continuer" onPress={() => setStep(2)} />}>
        <Header title="Vérification" />
        <Steps current={1} total={3} />
        <H1>Choisissez votre document</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>Il doit être valide et à votre nom.</P>
        {DOCS.map((d) => (
          <Choice key={d.id} icon="id" label={d.label} description={d.description} selected={doc === d.id} onPress={() => setDoc(d.id)} />
        ))}
      </Screen>
    );
  }

  if (step === 2) {
    const ready = front && (!needsBack || back);
    return (
      <Screen footer={<Button title="Continuer" onPress={() => setStep(3)} disabled={!ready} />}>
        <Header title="Vérification" />
        <Steps current={2} total={3} />
        <H1>Photographiez votre document</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>Posez-le à plat, bien éclairé, sans reflet. Les quatre coins doivent être visibles.</P>
        <Capture label={needsBack ? "Recto" : "Page photo"} done={front} onPress={() => setFront(true)} icon="id" />
        {needsBack ? <Capture label="Verso" done={back} onPress={() => setBack(true)} icon="id" /> : null}
        <Notice tone="neutral" icon="info" text="Version de démonstration : la prise de photo est simulée." />
      </Screen>
    );
  }

  if (step === 3) {
    return (
      <Screen footer={<Button title="Envoyer pour vérification" onPress={() => setStep(4)} disabled={!selfie} />}>
        <Header title="Vérification" />
        <Steps current={3} total={3} />
        <H1>Prenez un selfie</H1>
        <P style={{ marginTop: 6, marginBottom: 18 }}>Retirez lunettes et chapeau, placez votre visage dans le cadre et regardez l&apos;objectif.</P>
        <View style={st.selfie}>
          <View style={[st.oval, selfie && { borderColor: colors.success }]}>
            <Icon name={selfie ? "check" : "face"} color={selfie ? colors.success : colors.silver} size={64} strokeWidth={1.4} />
          </View>
        </View>
        <Button title={selfie ? "Reprendre le selfie" : "Prendre le selfie"} icon="camera" variant="secondary" onPress={() => setSelfie(true)} />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Accéder à mon compte" onPress={finish} />}>
      <View style={{ alignItems: "center", paddingTop: 60 }}>
        <View style={[st.heroIcon, { backgroundColor: colors.successSoft, width: 88, height: 88, borderRadius: 30 }]}>
          <Icon name="check" color={colors.success} size={44} strokeWidth={2.4} />
        </View>
        <H1 style={{ textAlign: "center" }}>Identité vérifiée</H1>
        <P style={{ textAlign: "center", marginTop: 8 }}>Merci {profile?.firstName}. Vous pouvez maintenant envoyer de l&apos;argent.</P>
        <Small style={{ textAlign: "center", marginTop: 16 }}>
          Démo : la vérification est validée automatiquement. En production, elle est confirmée par notre prestataire KYC.
        </Small>
      </View>
    </Screen>
  );
}

function Item({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return <ListItem icon={icon} title={title} subtitle={text} />;
}

function Capture({ label, done, onPress, icon }: { label: string; done: boolean; onPress: () => void; icon: IconName }) {
  return (
    <View style={[st.capture, done && { borderColor: colors.success, backgroundColor: colors.successSoft }]}>
      <Icon name={done ? "check" : icon} color={done ? colors.success : colors.brand} size={30} />
      <Text style={st.captureLabel}>{label}</Text>
      <Button title={done ? "Reprendre" : "Prendre la photo"} icon="camera" size="sm" variant={done ? "secondary" : "primary"} onPress={onPress} />
    </View>
  );
}

const st = StyleSheet.create({
  heroIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  capture: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.silver, borderRadius: radius.lg, padding: 20, alignItems: "center", gap: 10, marginBottom: 14, backgroundColor: colors.white },
  captureLabel: { fontFamily: fonts.heading, fontSize: 16, color: colors.ink },
  selfie: { alignItems: "center", marginVertical: 18 },
  oval: { width: 200, height: 250, borderRadius: 120, borderWidth: 3, borderStyle: "dashed", borderColor: colors.brand, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
});
