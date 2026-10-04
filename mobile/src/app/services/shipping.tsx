import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Checkbox, Chips } from "@/components/form";
import { PoleHero } from "@/components/pole";
import { Button, Card, Field, Header, Label, ListItem, Notice, Screen, Small } from "@/components/ui";
import { api } from "@/lib/api";
import { openSite } from "@/lib/links";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { colors } from "@/lib/theme";

const CITY: Record<string, string> = { CA: "Toronto, Canada", CM: "Douala, Cameroun", CN: "Guangzhou, Chine" };

export default function Shipping() {
  const { profile } = useSession();
  const { addRequest, requests } = useStore();
  const home = profile?.country ?? "CA";
  const [mode, setMode] = useState<"air" | "sea">("air");
  const [origin, setOrigin] = useState(profile?.address?.city ? `${profile.address.city}, ${home === "CA" ? "Canada" : home === "CM" ? "Cameroun" : "Chine"}` : CITY[home]);
  const [destination, setDestination] = useState(home === "CM" ? CITY.CA : CITY.CM);
  const [weight, setWeight] = useState("");
  const [dims, setDims] = useState("");
  const [content, setContent] = useState("");
  const [value, setValue] = useState("");
  const [pickup, setPickup] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const quotes = requests.filter((r) => r.kind === "shipping_quote");

  async function submit() {
    if (!profile) return;
    const e: Record<string, string> = {};
    const w = Number(weight.replace(",", "."));
    if (origin.trim().length < 2) e.origin = "Ville de départ requise";
    if (destination.trim().length < 2) e.destination = "Destination requise";
    if (!Number.isFinite(w) || w <= 0) e.weight = "Poids invalide";
    if (content.trim().length < 2) e.content = "Décrivez le contenu";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.submitRequest({
        kind: "shipping_quote",
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
        payload: {
          origin: origin.trim(),
          destination: destination.trim(),
          mode,
          weightKg: w,
          dimensionsCm: dims.trim() || undefined,
          content: content.trim(),
          declaredValue: value ? Number(value.replace(",", ".")) : undefined,
          pickup,
        },
      });
      const summary = { origin: origin.trim(), destination: destination.trim(), mode, weight: `${w} kg`, dims: dims.trim(), content: content.trim() };
      addRequest({ reference: res.reference, kind: "shipping_quote", createdAt: new Date().toISOString(), summary });
      router.replace({ pathname: "/services/shipping-done", params: { reference: res.reference, ...summary } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen footer={<Button title="Demander un devis" icon="ship" onPress={submit} loading={busy} />}>
      <Header title="Shipping" right={<Button title="Suivi" variant="ghost" size="sm" onPress={() => router.push("/services/tracking")} />} />
      <PoleHero icon="ship" label="PÔLE SHIPPING" title="Envoyez vos colis entre le Canada, le Cameroun et la Chine" text="Fret aérien ou maritime, accompagnement au dédouanement." />
      <Label>Mode d&apos;expédition</Label>
      <Chips
        options={[
          { value: "air", label: "Aérien · rapide, colis légers" },
          { value: "sea", label: "Maritime · économique, volumineux" },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Field label="Départ" value={origin} onChangeText={setOrigin} error={errors.origin} />
      <Field label="Destination" value={destination} onChangeText={setDestination} error={errors.destination} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field label="Poids estimé (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="12" error={errors.weight} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Dimensions (cm)" value={dims} onChangeText={setDims} placeholder="60 × 40 × 40" />
        </View>
      </View>
      <Field label="Contenu" value={content} onChangeText={setContent} placeholder="Vêtements et effets personnels" error={errors.content} />
      <Field label="Valeur déclarée (facultatif)" value={value} onChangeText={setValue} keyboardType="decimal-pad" />
      <Checkbox checked={pickup} onChange={setPickup}>
        <Small style={{ color: colors.ink }}>J&apos;ai besoin d&apos;un ramassage à domicile</Small>
      </Checkbox>
      {error ? (
        <View style={{ marginBottom: 10 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}
      <Small style={{ textAlign: "center", marginBottom: 14 }}>Devis gratuit et sans engagement</Small>
      {quotes.length ? (
        <Card style={{ paddingVertical: 4 }}>
          {quotes.slice(0, 3).map((q) => (
            <ListItem key={q.reference} icon="ship" title={`${q.summary.origin} → ${q.summary.destination}`} subtitle={`Demande ${q.reference}`} />
          ))}
        </Card>
      ) : null}
      <Button title="En savoir plus sur le site" variant="ghost" onPress={() => openSite("/shipping")} style={{ marginTop: 8 }} />
    </Screen>
  );
}
