import { router } from "expo-router";
import { Alert, Platform, Text, View } from "react-native";
import { Flag } from "@/components/flag";
import { Badge, Card, H1, ListItem, Screen, Small } from "@/components/ui";
import { countryName } from "@/lib/format";
import { openSite } from "@/lib/links";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

export default function Profile() {
  const { profile, signOut } = useSession();
  const { recipients } = useStore();
  if (!profile) return null;
  const kyc = profile.kyc === "verified";
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  function confirmLogout() {
    const run = async () => {
      await signOut();
      router.replace("/welcome");
    };
    if (Platform.OS === "web") return void run();
    Alert.alert("Se déconnecter ?", "Vous devrez vous reconnecter pour envoyer de l'argent.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => void run() },
    ]);
  }

  return (
    <Screen edges={["top"]}>
      <H1 style={{ marginTop: 8, marginBottom: 16 }}>Profil</H1>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.white, fontFamily: fonts.display, fontSize: 20 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.ink }} numberOfLines={1}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Small numberOfLines={1}>{profile.email}</Small>
          <Badge label={kyc ? "Identité vérifiée" : "Identité à vérifier"} tone={kyc ? "success" : "warn"} />
        </View>
      </Card>

      <Card style={{ paddingVertical: 6, marginBottom: 16 }}>
        <ListItem icon="phone" tone="neutral" title="Téléphone" subtitle={profile.phone} />
        <ListItem
          tone="neutral"
          title="Pays de résidence"
          subtitle={countryName(profile.country)}
          leading={
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
              <Flag code={profile.country} size={24} />
            </View>
          }
        />
        <ListItem icon="shield" tone={kyc ? "success" : "warn"} title="Vérification d'identité" subtitle={kyc ? "Validée" : "À compléter"} onPress={kyc ? undefined : () => router.push("/kyc")} />
        <ListItem icon="user" tone="neutral" title="Mes bénéficiaires" subtitle={`${recipients.length} enregistré${recipients.length > 1 ? "s" : ""}`} onPress={() => router.push("/recipients")} />
      </Card>

      <Card style={{ paddingVertical: 6, marginBottom: 16 }}>
        <ListItem icon="help" tone="neutral" title="Aide et contact" onPress={() => openSite("/aide")} />
        <ListItem icon="info" tone="neutral" title="Conditions d'utilisation" onPress={() => openSite("/conditions")} />
        <ListItem icon="lock" tone="neutral" title="Confidentialité" onPress={() => openSite("/confidentialite")} />
      </Card>

      <Card style={{ paddingVertical: 6 }}>
        <ListItem icon="logout" tone="danger" title="Se déconnecter" onPress={confirmLogout} right={<View />} />
      </Card>

      <Small style={{ textAlign: "center", marginTop: 18 }}>WorldSoft Transfer · version 1.0.0</Small>
    </Screen>
  );
}
