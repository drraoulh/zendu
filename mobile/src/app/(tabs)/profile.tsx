import { router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PoweredBy } from "@/components/brand";
import { Avatar, ConfirmDialog, SectionTitle } from "@/components/form";
import { Icon, type IconName } from "@/components/icons";
import { Badge, Card, ListItem, Screen, Small } from "@/components/ui";
import { referralCode, useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";

const LANG: Record<string, string> = { fr: "Français", en: "English", es: "Español", zh: "中文" };

export default function Profile() {
  const { profile, settings, signOut } = useSession();
  const { cards, recipients } = useStore();
  const [confirm, setConfirm] = useState(false);
  if (!profile) return null;
  const kyc = profile.kyc;
  const card = cards.find((c) => c.isDefault) ?? cards[0];
  const go = (href: Href) => () => router.push(href);

  return (
    <Screen edges={["top"]}>
      <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.navy, marginTop: 8, marginBottom: 16 }}>Profil</Text>

      <Card onPress={go("/account/info")} style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <Avatar name={`${profile.firstName} ${profile.lastName}`} size={58} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.ink }} numberOfLines={1}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Small numberOfLines={1}>{profile.email}</Small>
          <Badge
            label={kyc === "verified" ? "Identité vérifiée" : kyc === "pending" ? "Vérification en cours" : kyc === "rejected" ? "Vérification refusée" : "Identité à vérifier"}
            tone={kyc === "verified" ? "success" : kyc === "rejected" ? "danger" : "warn"}
          />
        </View>
        <Icon name="chev" color={colors.muted} size={18} />
      </Card>

      <Card onPress={go("/account/referral")} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.brandSoft, borderColor: colors.brandSoft }}>
        <Icon name="user" color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, color: colors.ink }}>Parrainez vos proches</Text>
          <Small>Code {referralCode(profile)}</Small>
        </View>
        <Icon name="chev" color={colors.brand} size={18} />
      </Card>

      <SectionTitle>Découvrir PWFINTECH</SectionTitle>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Tile icon="finance" label="Finances" onPress={go("/services/finances")} />
        <Tile icon="tech" label="Technologies" onPress={go("/services/technologies")} />
        <Tile icon="ship" label="Shipping" onPress={go("/services/shipping")} />
      </View>

      <SectionTitle>Compte</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="id" tone="neutral" title="Informations personnelles" onPress={go("/account/info")} />
        <ListItem icon="wallet" tone="neutral" title="Moyens de paiement" subtitle={card ? `•••• ${card.last4}` : "Aucune carte"} onPress={go("/account/payment-methods")} />
        <ListItem icon="user" tone="neutral" title="Mes destinataires" subtitle={`${recipients.length} enregistré${recipients.length > 1 ? "s" : ""}`} onPress={go("/recipients")} />
        {kyc === "none" || kyc === "rejected" ? <ListItem icon="shield" tone="warn" title="Vérifier mon identité" onPress={go("/kyc")} /> : null}
      </Card>

      <SectionTitle>Paramètres</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="lock" tone="neutral" title="Sécurité" onPress={go("/account/security")} />
        <ListItem icon="globe" tone="neutral" title="Langue" subtitle={LANG[settings.language]} onPress={go("/account/language")} />
        <ListItem icon="bell" tone="neutral" title="Notifications" onPress={go("/account/notifications")} />
      </Card>

      <SectionTitle>Assistance</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="help" tone="neutral" title="Aide" onPress={go("/help")} />
        <ListItem icon="mail" tone="neutral" title="Nous contacter" onPress={go("/help/contact")} />
        <ListItem icon="info" tone="neutral" title="Documents légaux" onPress={go("/legal")} />
      </Card>

      <View style={{ alignItems: "center", marginTop: 20, gap: 4 }}>
        <Small>WorldSoft Transfer 1.0.0</Small>
        <PoweredBy />
      </View>

      <Card style={{ paddingVertical: 4, marginTop: 16 }}>
        <ListItem icon="logout" tone="danger" title="Se déconnecter" onPress={() => setConfirm(true)} right={<View />} />
      </Card>

      <ConfirmDialog
        visible={confirm}
        title="Se déconnecter ?"
        message="Vous devrez saisir votre mot de passe ou utiliser Face ID pour vous reconnecter."
        confirmLabel="Se déconnecter"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await signOut();
          router.replace("/auth/login");
        }}
      />
    </Screen>
  );
}

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, alignItems: "center", gap: 6 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon name={icon} color={colors.brand} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.ink }} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}
