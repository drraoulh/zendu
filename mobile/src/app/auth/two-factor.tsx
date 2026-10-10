import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { OtpInput } from "@/components/form";
import { Button, H1, Header, Notice, P, Screen, Small } from "@/components/ui";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

/**
 * Étape 2 de la connexion : le code à 6 chiffres est vérifié par le serveur (/api/auth/verify-2fa),
 * qui ne délivre la session qu'à ce moment-là. En mode démo du serveur (aucun fournisseur SMS /
 * courriel configuré), le code est fourni par l'API et prérempli ici.
 */
export default function TwoFactor() {
  const { completeSignIn, resendCode, cancelSignIn, pending } = useSession();
  const [code, setCode] = useState(pending?.demoCode ?? "");
  const [countdown, setCountdown] = useState(pending?.resendAfter ?? 30);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restart, setRestart] = useState(false);
  const done = useRef(false);

  const demoCode = pending?.demoCode;
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Page rechargée (web) ou connexion abandonnée : retour à l'étape du mot de passe.
  useEffect(() => {
    if (!pending && !busy && !restart && !done.current) router.replace("/auth/login");
  }, [pending, busy, restart]);

  async function verify() {
    if (code.length !== 6) return setError("Saisissez les 6 chiffres.");
    setBusy(true);
    setError(null);
    const r = await completeSignIn(code);
    if (r.ok) done.current = true;
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      if (r.restart) setRestart(true);
      else setCode("");
      return;
    }
    router.dismissAll();
    router.replace(r.mustChangePassword ? "/auth/reset" : "/");
  }

  async function resend(channel?: "sms" | "email") {
    setError(null);
    setCode("");
    const r = await resendCode(channel);
    if (!r.ok) return setError(r.error);
    // Mode démo : le nouveau code est prérempli aussi.
    if (r.demoCode) setCode(r.demoCode);
    setCountdown(pending?.resendAfter ?? 30);
  }

  function backToLogin() {
    cancelSignIn();
    router.replace("/auth/login");
  }

  const channel = pending?.channel ?? "sms";

  return (
    <Screen
      footer={
        restart ? (
          <Button title="Revenir à la connexion" onPress={backToLogin} />
        ) : (
          <Button title="Vérifier" onPress={verify} loading={busy} disabled={code.length !== 6} />
        )
      }
    >
      <Header title="Vérification" />
      <H1>Vérification en deux étapes</H1>
      <P style={{ marginTop: 6 }}>
        Saisissez le code à 6 chiffres envoyé {channel === "sms" ? "par SMS au" : "par courriel à"}{" "}
        <Text style={{ color: colors.ink }}>{pending?.destination ?? ""}</Text>.
      </P>
      <OtpInput value={code} onChange={setCode} />
      {error ? <Text style={{ color: colors.danger, textAlign: "center", marginBottom: 8 }}>{error}</Text> : null}
      {!restart ? (
        <>
          <Small style={{ textAlign: "center", marginBottom: 8 }}>Le code expire dans 10 minutes · 5 essais au maximum.</Small>
          <View style={{ alignItems: "center", gap: 4, marginBottom: 16 }}>
            {countdown > 0 ? (
              <Small>Renvoyer le code dans 0:{String(countdown).padStart(2, "0")}</Small>
            ) : (
              <Button title="Renvoyer le code" variant="ghost" size="sm" onPress={() => void resend()} />
            )}
            <Button
              title={channel === "sms" ? "Recevoir par courriel" : "Recevoir par SMS"}
              variant="ghost"
              size="sm"
              disabled={countdown > 0}
              onPress={() => void resend(channel === "sms" ? "email" : "sms")}
            />
          </View>
        </>
      ) : null}
      {demoCode ? (
        <Notice
          tone="warn"
          icon="info"
          title="Mode démo"
          text={`Aucun SMS ni courriel n'est envoyé : le serveur de démonstration fournit le code (${demoCode}), déjà prérempli.`}
        />
      ) : null}
    </Screen>
  );
}
