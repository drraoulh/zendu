import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar } from "@/components/form";
import { Button, Card, Empty, Field, H1, Header, ListItem, Screen, Small } from "@/components/ui";
import { countryName, networkLabel } from "@/lib/format";
import { recipientDetail } from "@/lib/recipients";
import { useStore } from "@/lib/store";

export default function Recipients() {
  const { recipients } = useStore();
  const [q, setQ] = useState("");
  const list = recipients.filter((r) => r.fullName.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Screen footer={<Button title="Ajouter un destinataire" icon="plus" onPress={() => router.push("/recipients/new")} />}>
      <Header title="Mes destinataires" />
      <H1 style={{ marginBottom: 14 }}>Mes destinataires</H1>
      {recipients.length > 3 ? <Field label="Rechercher" placeholder="Rechercher un destinataire" value={q} onChangeText={setQ} /> : null}
      {recipients.length ? (
        <Small style={{ marginBottom: 8 }}>
          {list.length} DESTINATAIRE{list.length > 1 ? "S" : ""}
        </Small>
      ) : null}
      <Card style={{ paddingVertical: 6 }}>
        {list.length ? (
          list.map((r) => (
            <ListItem
              key={r.id}
              leading={<Avatar name={r.fullName} tone="soft" size={42} />}
              title={r.fullName}
              subtitle={`${networkLabel(r.network)} · ${countryName(r.country)}\n${recipientDetail(r)}`}
              onPress={() => router.push({ pathname: "/recipients/[id]", params: { id: r.id } })}
            />
          ))
        ) : (
          <Empty icon="user" title={recipients.length ? "Aucun résultat" : "Aucun destinataire"} text="Enregistrez vos proches pour leur envoyer de l'argent en un geste." />
        )}
      </Card>
      <View style={{ height: 8 }} />
    </Screen>
  );
}
