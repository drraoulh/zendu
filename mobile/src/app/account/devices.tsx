import * as Device from "expo-device";
import { Platform } from "react-native";
import { Badge, Card, Header, ListItem, Notice, P, Screen } from "@/components/ui";

export default function Devices() {
  const name = Device.modelName ?? (Platform.OS === "web" ? "Navigateur web" : "Cet appareil");
  const os = [Device.osName, Device.osVersion].filter(Boolean).join(" ");
  return (
    <Screen>
      <Header title="Appareils connectés" />
      <P style={{ marginBottom: 16 }}>Ces appareils ont accès à votre compte. Déconnectez ceux que vous ne reconnaissez pas.</P>
      <Card style={{ paddingVertical: 4, marginBottom: 14 }}>
        <ListItem icon={Platform.OS === "web" ? "tech" : "phone"} title={name} subtitle={`${os || Platform.OS} · actif maintenant`} right={<Badge label="Cet appareil" tone="success" />} />
      </Card>
      <Notice tone="neutral" icon="info" text="La liste des autres appareils sera disponible une fois les comptes reliés au serveur. Un appareil inconnu ? Changez votre mot de passe." />
    </Screen>
  );
}
