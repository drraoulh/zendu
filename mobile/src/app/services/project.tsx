import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar, Chips } from "@/components/form";
import { Button, Card, Field, Header, Label, ListItem, Notice, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

const TYPES = ["Site web", "Appli mobile", "Paiement / fintech", "Conseil IT", "Maintenance"];
const BUDGETS = ["< 5 k$", "5–15 k$", "15–40 k$", "40 k$ +"];
const DELAYS = ["< 1 mois", "1–3 mois", "3–6 mois", "Flexible"];

export default function Project() {
  const { profile } = useSession();
  const { addRequest } = useStore();
  const [types, setTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!profile) return;
    const e: Record<string, string> = {};
    if (!types.length) e.types = "Choisissez au moins un type de projet";
    if (description.trim().length < 10) e.description = "Décrivez votre projet (10 caractères minimum)";
    if (!budget) e.budget = "Choisissez un budget indicatif";
    if (!timeline) e.timeline = "Choisissez un délai";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.submitRequest({
        kind: "tech_project",
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
        payload: { projectTypes: types, description: description.trim(), budget, timeline, company: company.trim() || undefined },
      });
      addRequest({ reference: res.reference, kind: "tech_project", createdAt: new Date().toISOString(), summary: { types: types.join(", "), budget, timeline } });
      router.replace({ pathname: "/services/project-done", params: { reference: res.reference, types: types.join(" · "), budget, timeline } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => (errors[k] ? <Notice tone="danger" icon="alert" text={errors[k]} /> : null);

  return (
    <Screen footer={<Button title="Envoyer ma demande" icon="send" onPress={submit} loading={busy} />}>
      <Header title="Décrire mon projet" />
      <Label>Type de projet</Label>
      <Chips options={TYPES.map((t) => ({ value: t, label: t }))} value={types} multiple onChange={(v) => setTypes(types.includes(v) ? types.filter((x) => x !== v) : [...types, v])} />
      {err("types")}
      <Field
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Ex. une boutique en ligne pour mon commerce, avec paiement Mobile Money et une appli pour mes clients."
        multiline
        style={{ minHeight: 110, textAlignVertical: "top" }}
        error={errors.description}
      />
      <Label>Budget indicatif (CAD)</Label>
      <Chips options={BUDGETS.map((b) => ({ value: b, label: b }))} value={budget} onChange={setBudget} />
      {err("budget")}
      <Label>Délai souhaité</Label>
      <Chips options={DELAYS.map((d) => ({ value: d, label: d }))} value={timeline} onChange={setTimeline} />
      {err("timeline")}
      <Field label="Entreprise (facultatif)" value={company} onChangeText={setCompany} />
      <Card style={{ paddingVertical: 4, marginBottom: 12 }}>
        <ListItem
          leading={<Avatar name={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`} size={40} />}
          title={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`}
          subtitle={`${profile?.email ?? ""} · coordonnées du profil`}
          onPress={() => router.push("/account/edit")}
        />
      </Card>
      {error ? <Notice tone="danger" icon="alert" text={error} /> : <View />}
      <Notice tone="neutral" icon="info" text="Une pièce jointe (cahier des charges, maquette) pourra être envoyée par courriel à l'équipe après votre demande." />
    </Screen>
  );
}
