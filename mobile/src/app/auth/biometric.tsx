import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { WstWordmark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Button, H1, Notice, P, Screen } from "@/components/ui";
import { authenticate, biometricKind, biometricLabel, type BiometricKind } from "@/lib/biometrics";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

export default function Biometric() {
  const { signIn, accountFirstName } = useSession();
  const [kind, setKind] = useState<BiometricKind>("face");
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    const k = await biometricKind();
    setKind(k);
    if (k === "none") {
      setState("error");
      return setError("Aucune biométrie configurée sur cet appareil.");
    }
    const res = await authenticate("Se connecter à WorldSoft Transfer");
    if (!res.ok) {
      setState("error");
      return setError(res.error);
    }
    setState("ok");
    setError(null);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void run(), 300);
    return () => clearTimeout(t);
  }, [run]);

  async function continueIn() {
    await signIn();
    router.dismissAll();
    router.replace("/");
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 8 }}>
          {state === "ok" ? <Button title="Continuer" onPress={continueIn} /> : <Button title="Réessayer" icon="face" onPress={run} />}
          <Button title="Utiliser le mot de passe" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      <View style={{ paddingTop: 24 }}>
        <WstWordmark size={30} />
      </View>
      <View style={{ alignItems: "center", paddingTop: 56, gap: 14 }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 36,
            backgroundColor: state === "ok" ? colors.successSoft : colors.brandSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={state === "ok" ? "check" : "face"} size={60} color={state === "ok" ? colors.success : colors.brand} strokeWidth={1.6} />
        </View>
        <H1 style={{ textAlign: "center" }}>{state === "ok" ? "Identité reconnue" : "Regardez votre téléphone"}</H1>
        <P style={{ textAlign: "center" }}>
          {biometricLabel(kind)} vérifie votre identité pour vous connecter{accountFirstName ? ` en tant que ${accountFirstName}` : ""}.
        </P>
        {error ? <Notice tone="danger" icon="alert" text={error} /> : null}
      </View>
    </Screen>
  );
}
