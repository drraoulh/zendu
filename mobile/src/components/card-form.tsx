import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { cardBrand, expectedLength, expiryValid, formatCardNumber, formatExpiry, luhn, parseCardText } from "@/lib/cards";
import type { SavedCard } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";
import { WstSymbol } from "./brand";
import { Checkbox } from "./form";
import { Icon } from "./icons";
import { Button, Field, Small } from "./ui";

const BRAND_LABEL: Record<SavedCard["brand"], string> = { Visa: "VISA", Mastercard: "mastercard", Amex: "AMEX", Carte: "" };

/**
 * Saisie d'une carte, avec remplissage automatique :
 * - les champs sont déclarés « carte bancaire » : iOS et Android proposent les cartes enregistrées
 *   et, selon l'appareil, « Scanner une carte » (appareil photo) au-dessus du clavier ;
 * - un numéro collé avec sa date (« 4242 4242 4242 4242 08/29 ») remplit les deux champs ;
 * - le curseur passe tout seul au champ suivant.
 * Seuls la marque, les 4 derniers chiffres et l'expiration sont conservés : le numéro complet et le CVC
 * ne sont jamais enregistrés (en production, ils vont directement à Stripe).
 */
export function CardForm({ defaultHolder, submitLabel, onSubmit }: { defaultHolder: string; submitLabel: string; onSubmit: (c: Omit<SavedCard, "id">) => void }) {
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [holder, setHolder] = useState(defaultHolder);
  const [isDefault, setIsDefault] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [back, setBack] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const numberRef = useRef<TextInput>(null);
  const expRef = useRef<TextInput>(null);
  const cvcRef = useRef<TextInput>(null);
  const holderRef = useRef<TextInput>(null);
  const brand = cardBrand(number);
  const digits = number.replace(/\D/g, "");
  const numberOk = digits.length >= 13 && luhn(number);
  const clear = (key: string) => errors[key] && setErrors(({ [key]: _, ...rest }) => rest);

  function onNumber(v: string) {
    clear("number");
    const parsed = parseCardText(v);
    // Texte collé ou rempli par le téléphone (numéro + date) : on répartit dans les deux champs.
    if (parsed.number && parsed.exp) {
      setNumber(formatCardNumber(parsed.number));
      setExp(parsed.exp);
      setAutofilled(true);
      cvcRef.current?.focus();
      return;
    }
    const next = formatCardNumber(v);
    setNumber(next);
    const d = next.replace(/\D/g, "");
    if (d.length === expectedLength(next) && luhn(next)) expRef.current?.focus();
  }

  function onExp(v: string) {
    clear("exp");
    const next = formatExpiry(v);
    setExp(next);
    if (next.length === 5 && expiryValid(next)) cvcRef.current?.focus();
  }

  function onCvc(v: string) {
    clear("cvc");
    const next = v.replace(/\D/g, "").slice(0, brand === "Amex" ? 4 : 3);
    setCvc(next);
    if (next.length === (brand === "Amex" ? 4 : 3)) holderRef.current?.focus();
  }

  function submit() {
    const e: Record<string, string> = {};
    if (!numberOk) e.number = "Numéro de carte invalide";
    if (!expiryValid(exp)) e.exp = "Date invalide ou dépassée";
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = brand === "Amex" ? "4 chiffres" : "3 chiffres";
    if (holder.trim().length < 2) e.holder = "Nom requis";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ brand, last4: digits.slice(-4), exp, holder: holder.trim(), isDefault });
  }

  const shown = (digits ? formatCardNumber(digits).padEnd(19, "•") : "•••• •••• •••• ••••").slice(0, 19);

  return (
    <View>
      <View style={c.visual} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {back ? (
          <>
            <View style={c.strip} />
            <View style={c.cvcRow}>
              <View style={c.cvcBox}>
                <Text style={c.cvcText}>{cvc ? "•".repeat(cvc.length) : "CVC"}</Text>
              </View>
            </View>
            <Text style={c.meta}>Les 3 chiffres au dos de la carte (4 sur le devant pour Amex)</Text>
          </>
        ) : (
          <>
            <View style={c.top}>
              <WstSymbol size={30} negative />
              <Text style={[c.brand, brand === "Mastercard" && { fontFamily: fonts.heading, letterSpacing: 0 }]}>{BRAND_LABEL[brand] || "VISA · MASTERCARD"}</Text>
            </View>
            <View style={c.chip} />
            <Text style={c.number}>{shown}</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={c.caption}>TITULAIRE</Text>
                <Text style={c.meta} numberOfLines={1}>{(holder || "NOM SUR LA CARTE").toUpperCase()}</Text>
              </View>
              <View>
                <Text style={c.caption}>EXPIRE</Text>
                <Text style={c.meta}>{exp || "MM/AA"}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {Platform.OS !== "web" ? (
        <Pressable accessibilityRole="button" onPress={() => numberRef.current?.focus()} style={c.scan}>
          <View style={c.scanIcon}>
            <Icon name="camera" color={colors.brand} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={c.scanTitle}>Scanner ou remplir automatiquement</Text>
            <Small>
              Touchez le numéro : votre téléphone propose vos cartes enregistrées ou « Scanner une carte » au-dessus du clavier.
            </Small>
          </View>
        </Pressable>
      ) : null}
      {autofilled ? (
        <View style={c.filled} accessibilityRole="alert">
          <Icon name="check" color={colors.success} size={16} strokeWidth={2.6} />
          <Small style={{ color: colors.success, flex: 1 }}>Numéro et date remplis automatiquement. Ajoutez le CVC.</Small>
        </View>
      ) : null}

      <Field
        ref={numberRef}
        label="Numéro de carte"
        value={number}
        onChangeText={onNumber}
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        autoComplete="cc-number"
        textContentType="creditCardNumber"
        returnKeyType="next"
        onSubmitEditing={() => expRef.current?.focus()}
        error={errors.number}
        right={numberOk ? <Icon name="check" color={colors.success} size={18} strokeWidth={2.6} /> : null}
      />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field
            ref={expRef}
            label="Expiration"
            value={exp}
            onChangeText={onExp}
            placeholder="MM/AA"
            keyboardType="number-pad"
            autoComplete="cc-exp"
            textContentType="creditCardExpiration"
            error={errors.exp}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            ref={cvcRef}
            label="CVC"
            value={cvc}
            onChangeText={onCvc}
            placeholder={brand === "Amex" ? "4 chiffres" : "3 chiffres"}
            keyboardType="number-pad"
            secureTextEntry
            autoComplete="cc-csc"
            textContentType="creditCardSecurityCode"
            onFocus={() => setBack(true)}
            onBlur={() => setBack(false)}
            error={errors.cvc}
          />
        </View>
      </View>
      <Field
        ref={holderRef}
        label="Nom sur la carte"
        value={holder}
        onChangeText={(v) => {
          clear("holder");
          setHolder(v);
        }}
        autoComplete="cc-name"
        textContentType="creditCardName"
        autoCapitalize="characters"
        returnKeyType="done"
        onSubmitEditing={submit}
        error={errors.holder}
      />
      <Checkbox checked={isDefault} onChange={setIsDefault}>
        <Small style={{ color: colors.ink }}>Définir comme moyen de paiement par défaut</Small>
      </Checkbox>
      <Button title={submitLabel} icon="lock" onPress={submit} />
      <View style={c.secure}>
        <Icon name="shield" color={colors.muted} size={14} />
        <Small>Connexion chiffrée · aucun débit à l&apos;enregistrement · numéro complet jamais conservé</Small>
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  visual: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: 20, gap: 14, marginBottom: 14, minHeight: 196, overflow: "hidden", shadowColor: colors.navy, shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: colors.white, fontFamily: fonts.display, fontSize: 16, letterSpacing: 1 },
  chip: { width: 40, height: 30, borderRadius: 6, backgroundColor: "#d9b866" },
  number: { color: colors.white, fontFamily: fonts.heading, fontSize: 20, letterSpacing: 1.5 },
  caption: { color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 1 },
  meta: { color: "rgba(255,255,255,0.85)", fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.6 },
  strip: { height: 40, backgroundColor: "#0a0f24", marginHorizontal: -20, marginTop: 4 },
  cvcRow: { flexDirection: "row", justifyContent: "flex-end", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 6, padding: 8 },
  cvcBox: { backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.danger },
  cvcText: { fontFamily: fonts.heading, color: colors.ink, letterSpacing: 2 },
  scan: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: 12, marginBottom: 14 },
  scanIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  scanTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink, marginBottom: 2 },
  filled: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.successSoft, borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  secure: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 },
});
