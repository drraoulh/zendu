import { router } from "expo-router";
import { Text, View } from "react-native";
import type { Transfer } from "@/lib/api";
import { countryName, dateTime, money, statusInfo } from "@/lib/format";
import { colors, fonts } from "@/lib/theme";
import { Flag } from "./flag";
import { Badge, ListItem } from "./ui";

export function TransferRow({ transfer }: { transfer: Transfer }) {
  const info = statusInfo(transfer.status);
  return (
    <ListItem
      onPress={() => router.push({ pathname: "/transfer/[id]", params: { id: transfer.id } })}
      leading={
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
          <Flag code={transfer.destCountry} size={26} />
        </View>
      }
      title={transfer.beneficiary.fullName}
      subtitle={`${countryName(transfer.destCountry)} · ${dateTime(transfer.createdAt)}`}
      right={
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontFamily: fonts.heading, color: colors.ink, fontSize: 14 }}>{money(transfer.receiveAmountXaf, transfer.receiveCurrency)}</Text>
          <Badge label={info.label} tone={info.tone} />
        </View>
      }
    />
  );
}
