import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Network } from "@/lib/api";
import { COUNTRIES, type CountryCode } from "@/lib/corridors";
import { networkLabel } from "@/lib/format";
import type { Recipient } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { Flag } from "./flag";
import { Icon, type IconName } from "./icons";
import { Button, Choice, Field, Label, Small } from "./ui";

const NETWORK_ICON: Record<Network["type"], IconName> = { mobile_money: "phone", bank: "bank", cash: "cash" };

const PHONE_DIGITS: Record<CountryCode, [number, number]> = { CA: [10, 10], CM: [9, 9], CN: [11, 11] };

export function RecipientForm({
  country,
  networks,
  initial,
  submitLabel,
  onSubmit,
}: {
  country: CountryCode;
  networks: Network[];
  initial?: Partial<Recipient>;
  submitLabel: string;
  onSubmit: (r: Omit<Recipient, "id"> & { id?: string }, save: boolean) => void;
}) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [network, setNetwork] = useState(initial?.network ?? networks[0]?.id ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [bankCode, setBankCode] = useState(initial?.bankCode ?? "");
  const [save, setSave] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const type = networks.find((n) => n.id === network)?.type ?? "mobile_money";
  const bank = type === "bank";
  const c = COUNTRIES[country];

  function submit() {
    const e: Record<string, string> = {};
    if (fullName.trim().split(/\s+/).length < 2) e.fullName = "Prénom et nom, comme sur la pièce d'identité";
    const digits = phone.replace(/\D/g, "").replace(new RegExp(`^${c.dialCode}`), "").replace(/^0+/, "");
    const [min, max] = PHONE_DIGITS[country];
    if (!bank && (digits.length < min || digits.length > max)) e.phone = `Numéro invalide pour ${c.name}`;
    if (bank) {
      if (bankName.trim().length < 2) e.bankName = "Nom de la banque requis";
      if (!/^[A-Za-z0-9]{6,34}$/.test(accountNumber.replace(/[\s-]/g, ""))) e.accountNumber = "IBAN, RIB ou numéro de compte (6 à 34 caractères)";
      if (bankCode && !/^[A-Za-z0-9]{3,11}$/.test(bankCode.replace(/\s/g, ""))) e.bankCode = "Code SWIFT/BIC invalide";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit(
      {
        id: initial?.id,
        country,
        fullName: fullName.trim(),
        network,
        phone: digits ? `${c.dialCode}${digits}` : "",
        ...(bank
          ? { bankName: bankName.trim(), accountNumber: accountNumber.replace(/[\s-]/g, "").toUpperCase(), bankCode: bankCode.replace(/\s/g, "").toUpperCase() || undefined }
          : {}),
      },
      save,
    );
  }

  return (
    <View>
      <Field label="Nom complet du bénéficiaire" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={errors.fullName} />

      <Label>Mode de réception</Label>
      {networks.map((n) => (
        <Choice key={n.id} icon={NETWORK_ICON[n.type]} label={networkLabel(n.id)} selected={network === n.id} onPress={() => setNetwork(n.id)} />
      ))}

      <View style={{ height: 6 }} />
      {bank ? (
        <>
          <Field label="Banque" value={bankName} onChangeText={setBankName} error={errors.bankName} />
          <Field label="Numéro de compte / IBAN / RIB" value={accountNumber} onChangeText={setAccountNumber} autoCapitalize="characters" error={errors.accountNumber} />
          <Field label="Code SWIFT / BIC (facultatif)" value={bankCode} onChangeText={setBankCode} autoCapitalize="characters" error={errors.bankCode} />
        </>
      ) : null}
      <Field
        label={bank ? "Téléphone (facultatif)" : type === "cash" ? "Téléphone (pour le code de retrait)" : `Numéro ${networkLabel(network)}`}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={c.phonePlaceholder}
        error={errors.phone}
        left={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Flag code={country} size={20} />
            <Text style={{ fontFamily: fonts.semibold, color: colors.ink }}>+{c.dialCode}</Text>
          </View>
        }
      />

      {!initial?.id ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: save }}
          onPress={() => setSave(!save)}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: save ? colors.brand : colors.line,
              backgroundColor: save ? colors.brand : colors.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {save ? <Icon name="check" color={colors.white} size={14} strokeWidth={3} /> : null}
          </View>
          <Small style={{ color: colors.ink }}>Enregistrer ce bénéficiaire pour mes prochains envois</Small>
        </Pressable>
      ) : null}

      <Button title={submitLabel} onPress={submit} />
    </View>
  );
}
