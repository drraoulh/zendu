import { StyleSheet, Text, View } from "react-native";
import type { Transfer } from "@/lib/api";
import { countryName, etaLabel, money, networkLabel, phone, statusInfo } from "@/lib/format";
import { colors, fonts, radius } from "@/lib/theme";
import { PoweredBy, WstWordmark } from "./brand";
import { Flag } from "./flag";
import { Icon } from "./icons";

export function etaFor(t: Transfer) {
  if (t.beneficiary.network === "BANK") return "1-2 business days";
  return t.destCountry === "CM" ? "A few minutes" : "Under 24h";
}

/** Texte envoyé au bénéficiaire avec l'image (ou seul quand l'image n'est pas disponible). */
export function recipientMessage(t: Transfer) {
  const first = t.beneficiary.fullName.split(" ")[0];
  const ben = t.beneficiary;
  const where = ben.network === "BANK" ? `sur votre compte ${ben.bankName ?? "bancaire"}${ben.accountMasked ? ` (${ben.accountMasked})` : ""}` : ben.network === "CASH" ? "en retrait d'espèces" : `sur ${networkLabel(ben.network)}${ben.phone ? ` (${phone(ben.phone)})` : ""}`;
  const delivered = t.status === "delivered";
  return [
    `Bonjour ${first},`,
    `${t.senderName} vous a envoyé ${money(t.receiveAmountXaf, t.receiveCurrency)} avec WorldSoft Transfer.`,
    delivered ? `L'argent est disponible ${where}.` : `Vous le recevrez ${where} — délai estimé : ${etaLabel(etaFor(t)).toLowerCase()}.`,
    `Référence : ${t.reference}`,
    "WorldSoft Transfer — une solution PWFINTECH",
  ].join("\n");
}

/**
 * Avis pour le bénéficiaire : la « carte » que l'expéditeur partage (image) par WhatsApp, SMS…
 * Aucune donnée sensible : ni frais, ni taux, ni moyen de paiement de l'expéditeur.
 */
export function RecipientNotice({ transfer: t }: { transfer: Transfer }) {
  const ben = t.beneficiary;
  const info = statusInfo(t.status);
  const delivered = t.status === "delivered";
  const where =
    ben.network === "BANK"
      ? [ben.bankName, ben.accountMasked].filter(Boolean).join(" · ") || "Compte bancaire"
      : [networkLabel(ben.network), ben.phone ? phone(ben.phone) : null].filter(Boolean).join(" · ");

  return (
    <View style={s.card} collapsable={false}>
      <View style={s.head}>
        <WstWordmark size={26} negative />
      </View>
      <View style={s.body}>
        <View style={[s.state, { backgroundColor: delivered ? colors.successSoft : colors.brandSoft }]}>
          <Icon name={delivered ? "check" : "clock"} color={delivered ? colors.success : colors.brand} size={14} strokeWidth={2.6} />
          <Text style={[s.stateText, { color: delivered ? colors.success : colors.brand }]}>{delivered ? "Argent disponible" : info.label}</Text>
        </View>
        <Text style={s.hello}>Bonjour {ben.fullName.split(" ")[0]},</Text>
        <Text style={s.lead}>
          <Text style={s.strong}>{t.senderName}</Text> vous a envoyé
        </Text>
        <Text style={s.amount}>{money(t.receiveAmountXaf, t.receiveCurrency)}</Text>

        <View style={s.route}>
          <Flag code={t.sourceCountry} size={20} />
          <Text style={s.routeText}>{countryName(t.sourceCountry)}</Text>
          <Icon name="chev" size={14} color={colors.muted} />
          <Flag code={t.destCountry} size={20} />
          <Text style={s.routeText}>{countryName(t.destCountry)}</Text>
        </View>

        <View style={s.rows}>
          <Row label="Réception" value={where} />
          <Row label={delivered ? "Statut" : "Délai estimé"} value={delivered ? "Livré" : etaLabel(etaFor(t))} />
          <Row label="Référence" value={t.reference} strong />
        </View>
      </View>
      <View style={s.foot}>
        <PoweredBy />
      </View>
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, strong && { fontFamily: fonts.heading }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  head: { backgroundColor: colors.navy, paddingVertical: 18, paddingHorizontal: 20 },
  body: { padding: 20, gap: 4 },
  state: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, marginBottom: 12 },
  stateText: { fontFamily: fonts.semibold, fontSize: 12 },
  hello: { fontFamily: fonts.heading, fontSize: 17, color: colors.ink },
  lead: { fontSize: 15, color: colors.muted },
  strong: { fontFamily: fonts.heading, color: colors.ink },
  amount: { fontFamily: fonts.display, fontSize: 34, color: colors.brand, marginTop: 4 },
  route: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  routeText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  rows: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 7 },
  rowLabel: { fontSize: 13, color: colors.muted },
  rowValue: { flex: 1, textAlign: "right", fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  foot: { alignItems: "center", paddingVertical: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
});
