import { useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { localNumber, pickContact } from "@/lib/contacts";
import type { Network } from "@/lib/api";
import { COUNTRIES, type CountryCode } from "@/lib/corridors";
import { networkLabel } from "@/lib/format";
import type { Recipient } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { RELATIONS } from "@/lib/geo";
import { Flag } from "./flag";
import { PaymentLogo } from "./payment-logo";
import { Chips } from "./form";
import { Icon } from "./icons";
import { Button, Choice, Field, Label, Small } from "./ui";
import { tr } from "@/lib/i18n";


const PHONE_DIGITS: Record<CountryCode, [number, number]> = { CA: [10, 10], CM: [9, 9], CN: [11, 11] };

export function RecipientForm({
  country,
  networks,
  initial,
  submitLabel,
  onSubmit,
  withRelation = false,
}: {
  withRelation?: boolean;
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
  const [relation, setRelation] = useState(initial?.relation ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const type = networks.find((n) => n.id === network)?.type ?? "mobile_money";
  const bank = type === "bank";
  const c = COUNTRIES[country];

  async function fromContacts() {
    let picked;
    try {
      picked = await pickContact();
    } catch {
      return Alert.alert(tr("Contacts indisponibles"), tr("Autorisez l'accès aux contacts dans les réglages, ou saisissez le numéro."));
    }
    if (!picked) return;
    if (picked.fullName) setFullName(picked.fullName);
    const numbers = [...new Set(picked.phones.map((n) => localNumber(n, c.dialCode)).filter(Boolean))];
    if (numbers.length <= 1) return setPhone(numbers[0] ?? "");
    // Plusieurs numéros : le client choisit celui du compte mobile money.
    Alert.alert(tr("Quel numéro ?"), picked.fullName || undefined, [
      ...numbers.slice(0, 4).map((n) => ({ text: `+${c.dialCode} ${n}`, onPress: () => setPhone(n) })),
      { text: tr("Annuler"), style: "cancel" as const },
    ]);
  }

  function submit() {
    const e: Record<string, string> = {};
    if (fullName.trim().split(/\s+/).length < 2) e.fullName = tr("Prénom et nom, comme sur la pièce d'identité");
    const digits = phone.replace(/\D/g, "").replace(new RegExp(`^${c.dialCode}`), "").replace(/^0+/, "");
    const [min, max] = PHONE_DIGITS[country];
    if (!bank && (digits.length < min || digits.length > max)) e.phone = tr("Numéro invalide pour {0}", c.name);
    if (bank) {
      if (bankName.trim().length < 2) e.bankName = tr("Nom de la banque requis");
      if (!/^[A-Za-z0-9]{6,34}$/.test(accountNumber.replace(/[\s-]/g, ""))) e.accountNumber = tr("IBAN, RIB ou numéro de compte (6 à 34 caractères)");
      if (bankCode && !/^[A-Za-z0-9]{3,11}$/.test(bankCode.replace(/\s/g, ""))) e.bankCode = tr("Code SWIFT/BIC invalide");
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit(
      {
        ...(initial ?? {}),
        id: initial?.id,
        country,
        fullName: fullName.trim(),
        network,
        phone: digits ? `${c.dialCode}${digits}` : "",
        relation: relation || undefined,
        ...(bank
          ? { bankName: bankName.trim(), accountNumber: accountNumber.replace(/[\s-]/g, "").toUpperCase(), bankCode: bankCode.replace(/\s/g, "").toUpperCase() || undefined }
          : { bankName: undefined, accountNumber: undefined, bankCode: undefined }),
      },
      save,
    );
  }

  return (
    <View>
      {Platform.OS !== "web" && !initial?.id ? (
        <Button title={tr("Choisir dans mes contacts")} icon="user" variant="secondary" size="sm" onPress={() => void fromContacts()} style={{ marginBottom: 14 }} />
      ) : null}
      <Field label={tr("Nom complet du bénéficiaire")} value={fullName} onChangeText={setFullName} autoCapitalize="words" error={errors.fullName} />

      <Label>{tr("Mode de réception")}</Label>
      {networks.map((n) => (
        <Choice key={n.id} leading={<PaymentLogo id={n.id} size={26} />} label={networkLabel(n.id)} selected={network === n.id} onPress={() => setNetwork(n.id)} />
      ))}

      <View style={{ height: 6 }} />
      {bank ? (
        <>
          <Field label={tr("Banque")} value={bankName} onChangeText={setBankName} error={errors.bankName} />
          <Field label={tr("Numéro de compte / IBAN / RIB")} value={accountNumber} onChangeText={setAccountNumber} autoCapitalize="characters" error={errors.accountNumber} />
          <Field label={tr("Code SWIFT / BIC (facultatif)")} value={bankCode} onChangeText={setBankCode} autoCapitalize="characters" error={errors.bankCode} />
        </>
      ) : null}
      <Field
        label={bank ? tr("Téléphone (facultatif)") : network === "INTERAC" ? tr("Téléphone lié au compte Interac") : tr("Numéro {0}", networkLabel(network))}
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

      {withRelation ? (
        <>
          <Label>{tr("Relation")}</Label>
          <Chips options={RELATIONS.map((r) => ({ value: r, label: tr(r) }))} value={relation} onChange={(v) => setRelation(v === relation ? "" : v)} />
        </>
      ) : null}

      {!initial?.id && !withRelation ? (
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
          <Small style={{ color: colors.ink }}>{tr("Enregistrer ce bénéficiaire pour mes prochains envois")}</Small>
        </Pressable>
      ) : null}

      <Button title={tr(submitLabel)} onPress={submit} />
    </View>
  );
}
