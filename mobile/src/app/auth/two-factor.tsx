import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { OtpInput } from "@/components/form";
import { Button, H1, Header, Notice, P, Screen, Small } from "@/components/ui";
import { maskEmail } from "@/lib/geo";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

export default function TwoFactor() {
  const { completeSignIn, pending: contact } = useSession();
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(45);
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function verify() {
    if (code.length !== 6) return setError("Saisissez les 6 chiffres.");
    const r = await completeSignIn();
    router.dismissAll();
    router.replace(r.mustChangePassword ? "/auth/reset" : "/");
  }

  const phoneTail = contact?.phone.replace(/\D/g, "").slice(-2) ?? "••";
  const target = channel === "sms" ? `${contact?.phone.split(" ")[0] ?? ""} •••• ${phoneTail}` : maskEmail(contact?.email ?? "");

  return (
    <Screen footer={<Button title="Vérifier" onPress={verify} disabled={code.length !== 6} />}>
      <Header title="Vérification" />
      <H1>Vérification en deux étapes</H1>
      <P style={{ marginTop: 6 }}>
        Saisissez le code à 6 chiffres envoyé {channel === "sms" ? "par SMS au" : "par courriel à"} <Text style={{ color: colors.ink }}>{target}</Text>.
      </P>
      <OtpInput value={code} onChange={setCode} />
      {error ? <Text style={{ color: colors.danger, textAlign: "center" }}>{error}</Text> : null}
      <Small style={{ textAlign: "center", marginBottom: 8 }}>Le code expire dans 10 minutes.</Small>
      <View style={{ alignItems: "center", gap: 4, marginBottom: 16 }}>
        {countdown > 0 ? (
          <Small>Renvoyer le code dans 0:{String(countdown).padStart(2, "0")}</Small>
        ) : (
          <Button title="Renvoyer" variant="ghost" size="sm" onPress={() => setCountdown(45)} />
        )}
        <Button
          title={channel === "sms" ? "Recevoir par courriel" : "Recevoir par SMS"}
          variant="ghost"
          size="sm"
          onPress={() => {
            setChannel(channel === "sms" ? "email" : "sms");
            setCountdown(45);
            setCode("");
          }}
        />
      </View>
      <Notice tone="neutral" icon="info" text="Version de démonstration : aucun code n'est envoyé, saisissez 6 chiffres au choix." />
    </Screen>
  );
}
