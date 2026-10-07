import { useCallback, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { cardBrand, expectedLength, expiryValid, formatCardNumber, formatExpiry, luhn, parseCardText } from "@/lib/cards";
import type { SavedCard } from "@/lib/store";
import { colors, fonts, radius } from "@/lib/theme";
import { WstSymbol } from "./brand";
import { cardScanAvailable, CardScanner, type ScannedCard } from "./card-scanner";
import { cardLogoId, PaymentLogo } from "./payment-logo";
import { Checkbox } from "./form";
import { Icon } from "./icons";
import { Button, Field, Small } from "./ui";


/**
 * Saisie d'une carte, avec remplissage automatique :
 * - « Scanner ma carte » : l'appareil photo lit le numéro, l'expiration et le nom (sur le téléphone) ;
 * - les champs sont déclarés « carte bancaire » : iOS et Android proposent aussi les cartes enregistrées ;
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
  const [autofilled, setAutofilled] = useState<"" | "paste" | "scan">("");
  const [scanning, setScanning] = useState(false);
  // Taille du numéro selon la largeur de la carte dessinée (19 caractères doivent tenir sur une ligne).
  const [numberSize, setNumberSize] = useState(20);
  // Pendant la saisie (clavier ouvert), la carte dessinée devient un bandeau compact pour laisser
  // les champs visibles au-dessus du clavier sur les petits écrans.
  const [typing, setTyping] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingOn = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setTyping(true);
  };
  // Petit délai : passer d'un champ à l'autre ne doit pas faire réapparaître la grande carte.
  const typingOff = () => {
    blurTimer.current = setTimeout(() => setTyping(false), 150);
  };
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
      setAutofilled("paste");
      cvcRef.current?.focus();
      return;
    }
    const next = formatCardNumber(v);
    setNumber(next);
    const d = next.replace(/\D/g, "");
    if (d.length === expectedLength(next) && luhn(next)) expRef.current?.focus();
  }

  const onScanned = useCallback((card: ScannedCard) => {
    setScanning(false);
    setNumber(formatCardNumber(card.number));
    if (card.exp) setExp(card.exp);
    if (card.holder) setHolder(card.holder);
    setErrors({});
    setAutofilled("scan");
    // Laisse la fenêtre de la caméra se fermer avant d'ouvrir le clavier.
    setTimeout(() => (card.exp ? cvcRef : expRef).current?.focus(), 400);
  }, []);
  const closeScanner = useCallback(() => setScanning(false), []);

  function startScan() {
    if (cardScanAvailable) return setScanning(true);
    Alert.alert(
      "Scan indisponible ici",
      "Le scan de carte fonctionne dans l'application installée (APK Android ou version iPhone). Dans Expo Go, saisissez la carte ou utilisez le remplissage automatique du clavier.",
    );
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
      {typing ? (
        <View style={c.compact} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {brand === "Carte" ? <PaymentLogo id="CARD" size={22} /> : <PaymentLogo id={cardLogoId(brand)} size={22} />}
          <Text style={c.compactNumber} numberOfLines={1}>
            {back ? `CVC ${cvc ? "•".repeat(cvc.length) : "•••"}` : digits ? `•••• ${digits.slice(-4).padStart(4, "•")}` : "•••• ••••"}
          </Text>
          <Text style={c.compactExp}>{exp || "MM/AA"}</Text>
        </View>
      ) : null}
      <View
        style={[c.visual, typing && { display: "none" }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={(e) => setNumberSize(Math.max(13, Math.min(20, Math.floor((e.nativeEvent.layout.width - 40) / 14))))}
      >
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
              {brand === "Carte" ? (
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <PaymentLogo id="VISA" size={24} />
                  <PaymentLogo id="MASTERCARD" size={24} />
                </View>
              ) : (
                <PaymentLogo id={cardLogoId(brand)} size={30} />
              )}
            </View>
            <View style={c.chip} />
            <Text style={[c.number, { fontSize: numberSize, letterSpacing: numberSize * 0.075 }]} numberOfLines={1}>
              {shown}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={c.caption}>TITULAIRE</Text>
                <Text style={c.meta} numberOfLines={1}>{(holder || "NOM SUR LA CARTE").toUpperCase()}</Text>
              </View>
              <View>
                <Text style={c.caption}>EXPIRE</Text>
                <Text style={c.meta} numberOfLines={1}>{exp || "MM/AA"}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {Platform.OS !== "web" && !typing ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Scanner ma carte avec l'appareil photo" onPress={startScan} style={({ pressed }) => [c.scan, pressed && { opacity: 0.85 }]}>
          <View style={c.scanIcon}>
            <Icon name="camera" color={colors.white} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={c.scanTitle}>Scanner ma carte</Text>
            <Small>Numéro, date et nom remplis avec l&apos;appareil photo</Small>
          </View>
          <Icon name="chev" color={colors.brand} size={18} />
        </Pressable>
      ) : null}
      {autofilled ? (
        <View style={c.filled} accessibilityRole="alert">
          <Icon name="check" color={colors.success} size={16} strokeWidth={2.6} />
          <Small style={{ color: colors.success, flex: 1 }}>
            {autofilled === "scan" ? "Carte scannée : vérifiez les informations puis ajoutez le CVC." : "Numéro et date remplis automatiquement. Ajoutez le CVC."}
          </Small>
        </View>
      ) : null}
      {Platform.OS !== "web" ? <CardScanner visible={scanning} onClose={closeScanner} onScanned={onScanned} /> : null}

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
        onFocus={typingOn}
        onBlur={typingOff}
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
            onFocus={typingOn}
            onBlur={typingOff}
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
            onFocus={() => {
              setBack(true);
              typingOn();
            }}
            onBlur={() => {
              setBack(false);
              typingOff();
            }}
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
        onFocus={typingOn}
        onBlur={typingOff}
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
  chip: { width: 40, height: 30, borderRadius: 6, backgroundColor: "#d9b866" },
  number: { color: colors.white, fontFamily: fonts.heading, fontSize: 20, letterSpacing: 1.5 },
  caption: { color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 1 },
  meta: { color: "rgba(255,255,255,0.85)", fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.6 },
  compact: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.navy, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  compactNumber: { flex: 1, color: colors.white, fontFamily: fonts.heading, fontSize: 15, letterSpacing: 1 },
  compactExp: { color: "rgba(255,255,255,0.8)", fontFamily: fonts.semibold, fontSize: 13 },
  strip: { height: 40, backgroundColor: "#0a0f24", marginHorizontal: -20, marginTop: 4 },
  cvcRow: { flexDirection: "row", justifyContent: "flex-end", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 6, padding: 8 },
  cvcBox: { backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: colors.danger },
  cvcText: { fontFamily: fonts.heading, color: colors.ink, letterSpacing: 2 },
  scan: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.brandSoft, borderRadius: radius.md, padding: 12, marginBottom: 14 },
  scanIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  scanTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.ink, marginBottom: 2 },
  filled: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.successSoft, borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  secure: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 },
});
