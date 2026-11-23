import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { PinPad } from "@/components/pin-pad";
import { H1, Header, P, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";
import { tr } from "@/lib/i18n";
import { useSecureScreen } from "@/lib/secure-screen";

export default function PinSetup() {
  useSecureScreen();
  const { setPin, checkPin, settings, signOut } = useSession();
  // Un code est déjà actif : il faut d'abord saisir l'actuel pour le changer (sinon quelqu'un qui tient le téléphone déverrouillé pourrait le remplacer).
  const [verified, setVerified] = useState(!settings.pin);
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handle(v: string) {
    setError(null);
    if (v.length < 6) return setValue(v);
    if (!verified) {
      const res = await checkPin(v);
      setValue("");
      if (res.ok) return setVerified(true);
      if (res.left <= 0) {
        // 5 codes faux de suite : retour à la connexion par mot de passe.
        await signOut();
        return router.replace("/auth/login");
      }
      return setError(tr("Code incorrect · {0} essai{1} restant{2}", res.left, res.left > 1 ? "s" : "", res.left > 1 ? "s" : ""));
    }
    if (!first) {
      if (/^(\d)\1{5}$/.test(v) || v === "123456") {
        setError(tr("Choisissez un code moins prévisible."));
        return setValue("");
      }
      setFirst(v);
      return setValue("");
    }
    if (v === first) {
      setValue(v);
      void setPin(v).then(() => router.back());
    } else {
      setError(tr("Les codes ne correspondent pas. Recommencez."));
      setFirst(null);
      setValue("");
    }
  }

  return (
    <Screen scroll={false}>
      <Header title={tr("Code PIN de l'appli")} />
      <View style={{ alignItems: "center", gap: 8, marginTop: 12, marginBottom: 24 }}>
        <H1 style={{ textAlign: "center", fontSize: 22 }}>{!verified ? tr("Entrez votre code actuel") : first ? tr("Confirmez votre code") : tr("Choisissez un code à 6 chiffres")}</H1>
        <P style={{ textAlign: "center" }}>{!verified ? tr("Pour changer de code, saisissez d'abord celui que vous utilisez aujourd'hui.") : tr("Il sera demandé à chaque ouverture de l'appli.")}</P>
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      </View>
      <PinPad
        value={value}
        onChange={handle}
      />
    </Screen>
  );
}
