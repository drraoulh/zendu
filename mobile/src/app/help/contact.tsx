import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { View } from "react-native";
import { Chips } from "@/components/form";
import { Button, Card, Field, H2, Header, Label, ListItem, Notice, Screen, Small } from "@/components/ui";
import { api } from "@/lib/api";
import { company, PLACEHOLDER } from "@/lib/company";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";

const SUBJECTS = [
  { value: "transfert", label: "Transfert" },
  { value: "shipping", label: "Colis" },
  { value: "autre", label: "Autre" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];

export default function Contact() {
  const params = useLocalSearchParams<{ subject?: string }>();
  const { profile } = useSession();
  const { addRequest } = useStore();
  // Ouvert depuis le suivi d'un colis (« Colis PWS-… ») : sujet « Colis » déjà choisi.
  const [subject, setSubject] = useState<Subject>(params.subject?.startsWith("Colis") ? "shipping" : "transfert");
  const [title, setTitle] = useState(params.subject ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  async function send() {
    if (!profile) return;
    setError(null);
    if (message.trim().length < 5) return setError("Décrivez votre demande (5 caractères minimum).");
    setBusy(true);
    try {
      const body = title.trim() ? `${title.trim()}\n\n${message.trim()}` : message.trim();
      const res = await api.submitRequest({
        kind: "contact",
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
        payload: { subject, message: body },
      });
      addRequest({ reference: res.reference, kind: "contact", createdAt: new Date().toISOString(), summary: { subject: title || subject } });
      setSent(res.reference);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Header title="Nous contacter" />
      <Card style={{ paddingVertical: 4, marginBottom: 16 }}>
        <ListItem
          icon="mail"
          title="Courriel"
          subtitle={company.email ?? PLACEHOLDER}
          onPress={company.email ? () => Linking.openURL(`mailto:${company.email}`) : undefined}
        />
        <ListItem
          icon="phone"
          title="WhatsApp"
          subtitle={company.whatsapp ?? PLACEHOLDER}
          onPress={company.whatsapp ? () => Linking.openURL(`https://wa.me/${company.whatsapp?.replace(/\D/g, "")}`) : undefined}
        />
        <ListItem
          icon="phone"
          title="Téléphone"
          subtitle={company.phone ?? PLACEHOLDER}
          onPress={company.phone ? () => Linking.openURL(`tel:${company.phone?.replace(/\s/g, "")}`) : undefined}
        />
      </Card>

      <H2 style={{ fontSize: 18, marginBottom: 6 }}>Écrire à l&apos;équipe</H2>
      <Small style={{ marginBottom: 14 }}>Bonjour {profile?.firstName} ! Comment pouvons-nous vous aider aujourd&apos;hui ?</Small>
      {sent ? (
        <View style={{ gap: 10 }}>
          <Notice tone="success" icon="check" title="Message envoyé" text={`Référence ${sent}. Nous vous répondons par courriel à ${profile?.email}.`} />
          <Button title="Écrire un autre message" variant="secondary" onPress={() => setSent(null)} />
        </View>
      ) : (
        <>
          <Label>Sujet</Label>
          <Chips options={[...SUBJECTS]} value={subject} onChange={setSubject} />
          <Field label="Objet" value={title} onChangeText={setTitle} placeholder="Ex. Transfert PW-XXXXXX" />
          <Field label="Message" value={message} onChangeText={setMessage} placeholder="Décrivez votre demande" multiline numberOfLines={5} style={{ minHeight: 110, textAlignVertical: "top" }} />
          {error ? (
            <View style={{ marginBottom: 10 }}>
              <Notice tone="danger" icon="alert" text={error} />
            </View>
          ) : null}
          <Button title="Envoyer le message" icon="send" onPress={send} loading={busy} />
        </>
      )}
    </Screen>
  );
}
