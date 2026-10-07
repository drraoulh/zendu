import { router } from "expo-router";
import { Text, View, useWindowDimensions } from "react-native";
import type { Transfer } from "@/lib/api";
import { countryName, dateTime, money, statusInfo } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import { Flag } from "./flag";
import { PaymentLogo } from "./payment-logo";
import { Badge, ListItem } from "./ui";

export function TransferRow({ transfer }: { transfer: Transfer }) {
  const info = statusInfo(transfer.status);
  // 320 px : le montant à droite réduisait le nom à une colonne de 80 px (« Marie / Ngono » sur deux lignes).
  // Il passe alors sous le nom, à côté du statut.
  const narrow = useWindowDimensions().width < 360;
  const amount = <Text style={{ fontFamily: fonts.heading, color: colors.ink, fontSize: 14, textAlign: "right" }}>{money(transfer.receiveAmountXaf, transfer.receiveCurrency)}</Text>;
  return (
    <ListItem
      onPress={() => router.push({ pathname: "/transfer/[id]", params: { id: transfer.id } })}
      leading={
        <View style={{ width: 46, height: 42, justifyContent: "center" }}>
          <PaymentLogo id={transfer.beneficiary.network} size={28} />
          <View style={{ position: "absolute", right: -2, bottom: 0, borderRadius: 3, borderWidth: 1.5, borderColor: colors.white }}>
            <Flag code={transfer.destCountry} size={14} />
          </View>
        </View>
      }
      title={transfer.beneficiary.fullName}
      subtitle={`${countryName(transfer.destCountry)} · ${dateTime(transfer.createdAt)}`}
      subtitleLines={3}
      // Statut sous le nom : à droite, un long statut (« En attente de paiement ») écrasait le nom.
      extra={
        <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <Badge label={info.label} tone={info.tone} />
          {narrow ? amount : null}
        </View>
      }
      right={narrow ? <View /> : amount}
    />
  );
}
