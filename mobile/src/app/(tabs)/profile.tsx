import Constants from "expo-constants";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { PoweredBy } from "@/components/brand";
import { Avatar, ConfirmDialog, SectionTitle } from "@/components/form";
import { Icon } from "@/components/icons";
import { Badge, Card, ListItem, Screen, Small } from "@/components/ui";
import { payMethodsOf, useCorridors } from "@/lib/corridors";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { dateTime } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

const LANG: Record<string, string> = { fr: tr("Français"), en: tr("English"), es: tr("Español"), zh: "中文" };

export default function Profile() {
  const { profile, settings, signOut } = useSession();
  const { cards, recipients } = useStore();
  const [confirm, setConfirm] = useState(false);
  const cardsOpen = useCorridors().some((c) => payMethodsOf(c).includes("card"));
  if (!profile) return null;
  const kyc = profile.kyc;
  const card = cards.find((c) => c.isDefault) ?? cards[0];
  const go = (href: Href) => () => router.push(href);

  return (
    <Screen edges={["top"]}>
      <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.navy, marginTop: 8, marginBottom: 16 }}>{tr("Profil")}</Text>

      <Card onPress={go("/account/info")} style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <Avatar name={`${profile.firstName} ${profile.lastName}`} size={58} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 17, color: colors.ink }} numberOfLines={1}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Small numberOfLines={1}>{profile.email}</Small>
          <Badge
            label={kyc === "verified" ? tr("Identité vérifiée") : kyc === "pending" ? tr("Vérification en cours") : kyc === "rejected" ? tr("Vérification refusée") : tr("Identité à vérifier")}
            tone={kyc === "verified" ? "success" : kyc === "rejected" ? "danger" : "warn"}
          />
        </View>
        <Icon name="chev" color={colors.muted} size={18} />
      </Card>

      {/* Parrainage masqué tant que le programme de récompenses n'est pas actif (écran /account/referral conservé). */}

      <SectionTitle>{tr("Compte")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="id" tone="neutral" title={tr("Informations personnelles")} onPress={go("/account/info")} />
        <ListItem icon="wallet" tone="neutral" title={tr("Moyens de paiement")} subtitle={tr("Virement Interac{0}", cardsOpen && card ? tr(" · carte •••• {0}", card.last4) : "")} onPress={go("/account/payment-methods")} />
        <ListItem icon="ship" tone="neutral" title={tr("Suivre un colis")} onPress={go("/(tabs)/parcels")} />
        <ListItem icon="user" tone="neutral" title={tr("Mes destinataires")} subtitle={tr("{0} enregistré{1}", recipients.length, recipients.length > 1 ? "s" : "")} onPress={go("/recipients")} />
        <ListItem
          icon="shield"
          tone={kyc === "verified" ? "success" : kyc === "rejected" ? "danger" : "warn"}
          title={tr("Vérification d'identité")}
          subtitle={
            kyc === "verified"
              ? profile.kycVerifiedAt ? tr("Vérifiée le {0}", dateTime(profile.kycVerifiedAt).split(" · ")[0]) : tr("Vérifiée")
              : kyc === "pending"
                ? tr("En cours d'examen · nous vous prévenons dès qu'elle est terminée")
                : kyc === "rejected"
                  ? profile.kycNote ?? tr("Refusée · recommencez avec un document valide")
                  : tr("À faire avant votre premier envoi · 2 min")
          }
          subtitleLines={3}
          onPress={kyc === "none" || kyc === "rejected" ? go("/kyc") : undefined}
        />
        <ListItem icon="send" tone="neutral" title={tr("Limites d'envoi")} subtitle={tr("Minimum et maximum par envoi")} onPress={go("/account/limits")} />
      </Card>

      <SectionTitle>{tr("Paramètres")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="lock" tone="neutral" title={tr("Sécurité")} onPress={go("/account/security")} />
        <ListItem icon="globe" tone="neutral" title={tr("Langue")} subtitle={tr(LANG[settings.language])} onPress={go("/account/language")} />
        <ListItem icon="bell" tone="neutral" title={tr("Notifications")} onPress={go("/account/notifications")} />
      </Card>

      <SectionTitle>{tr("Assistance")}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="help" tone="neutral" title={tr("Aide")} onPress={go("/help")} />
        <ListItem icon="mail" tone="neutral" title={tr("Nous contacter")} onPress={go("/help/contact")} />
        <ListItem icon="info" tone="neutral" title={tr("Documents légaux")} onPress={go("/legal")} />
      </Card>

      <View style={{ alignItems: "center", marginTop: 20, gap: 4 }}>
        <Small>{tr("WorldSoft Transfer {0}", Constants.expoConfig?.version ?? "1.0.0")}</Small>
        <PoweredBy />
      </View>

      <Card style={{ paddingVertical: 4, marginTop: 16 }}>
        <ListItem icon="logout" tone="danger" title={tr("Se déconnecter")} onPress={() => setConfirm(true)} right={<View />} />
      </Card>

      <ConfirmDialog
        visible={confirm}
        title={tr("Se déconnecter ?")}
        message={tr("Vous devrez saisir votre courriel et votre mot de passe pour vous reconnecter sur cet appareil.")}
        confirmLabel={tr("Se déconnecter")}
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
