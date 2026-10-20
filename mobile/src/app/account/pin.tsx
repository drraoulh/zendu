import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { PinPad } from "@/components/pin-pad";
import { H1, Header, P, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";
import { tr } from "@/lib/i18n";

export default function PinSetup() {
  const { setPin } = useSession();
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handle(v: string) {
    setError(null);
    if (v.length < 6) return setValue(v);
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
        <H1 style={{ fontFamily: fonts.regular, textAlign: "center", fontSize: 22 }}>{first ? tr("Confirmez votre code") : tr("Choisissez un code à 6 chiffres")}</H1>
        <P style={{ textAlign: "center" }}>{tr("Il sera demandé à chaque ouverture de l'appli.")}</P>
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      </View>
      <PinPad
        value={value}
        onChange={handle}
      />
    </Screen>
  );
}
