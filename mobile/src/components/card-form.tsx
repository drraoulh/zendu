import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { cardBrand, expiryValid, formatCardNumber, formatExpiry, luhn } from "@/lib/cards";
import type { SavedCard } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";
import { Checkbox } from "./form";
import { Button, Field, Small } from "./ui";

/**
 * Saisie d'une carte. Seuls la marque, les 4 derniers chiffres et l'expiration sont conservés :
 * le numéro complet et le CVC ne sont jamais enregistrés (en production, ils iraient directement à Stripe).
 */
export function CardForm({ defaultHolder, submitLabel, onSubmit }: { defaultHolder: string; submitLabel: string; onSubmit: (c: Omit<SavedCard, "id">) => void }) {
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState(defaultHolder);
  const [isDefault, setIsDefault] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const brand = cardBrand(number);
  // Une erreur disparaît dès que l'on corrige le champ : sinon « Numéro de carte invalide » restait affiché
  // sous un numéro valide jusqu'au prochain envoi.
  const edit = (key: string, set: (v: string) => void) => (v: string) => {
    set(v);
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest);
  };

  function submit() {
    const e: Record<string, string> = {};
    if (!luhn(number)) e.number = "Numéro de carte invalide";
    if (!expiryValid(exp)) e.exp = "Date invalide ou dépassée";
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = "3 ou 4 chiffres";
    if (holder.trim().length < 2) e.holder = "Nom requis";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ brand, last4: number.replace(/\D/g, "").slice(-4), exp, holder: holder.trim(), isDefault });
  }

  const digits = number.replace(/\D/g, "");
  return (
    <View>
      <View style={c.visual} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={c.brand}>{brand === "Carte" ? "Visa · Mastercard" : brand}</Text>
        <Text style={c.number}>{(digits ? formatCardNumber(digits).padEnd(19, "•") : "•••• •••• •••• ••••").slice(0, 19)}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={c.meta}>{(holder || "NOM SUR LA CARTE").toUpperCase()}</Text>
          <Text style={c.meta}>{exp || "MM/AA"}</Text>
        </View>
      </View>
      <Field
        label="Numéro de carte"
        value={number}
        onChangeText={edit("number", (v) => setNumber(formatCardNumber(v)))}
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        autoComplete="cc-number"
        textContentType="creditCardNumber"
        error={errors.number}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Expiration" value={exp} onChangeText={edit("exp", (v) => setExp(formatExpiry(v)))} placeholder="MM/AA" keyboardType="number-pad" autoComplete="cc-exp" error={errors.exp} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="CVC" value={cvc} onChangeText={edit("cvc", (v) => setCvc(v.replace(/\D/g, "").slice(0, 4)))} placeholder="3 chiffres" keyboardType="number-pad" secureTextEntry autoComplete="cc-csc" error={errors.cvc} />
        </View>
      </View>
      <Field label="Nom sur la carte" value={holder} onChangeText={edit("holder", setHolder)} autoComplete="cc-name" error={errors.holder} />
      <Checkbox checked={isDefault} onChange={setIsDefault}>
        <Small style={{ color: colors.ink }}>Définir comme moyen de paiement par défaut</Small>
      </Checkbox>
      <Button title={submitLabel} icon="lock" onPress={submit} />
      <Small style={{ textAlign: "center", marginTop: 10 }}>Connexion chiffrée · aucun débit à l&apos;enregistrement</Small>
    </View>
  );
}

const c = StyleSheet.create({
  visual: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: 20, gap: 16, marginBottom: 18 },
  brand: { color: colors.sky, fontFamily: fonts.heading, fontSize: 14 },
  number: { color: colors.white, fontFamily: fonts.heading, fontSize: 20, letterSpacing: 1.5 },
  meta: { color: "rgba(255,255,255,0.75)", fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.6 },
});
