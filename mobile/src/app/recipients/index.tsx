import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar } from "@/components/form";
import { Button, Card, Empty, Field, Header, ListItem, Screen, Small } from "@/components/ui";
import { countryName, networkLabel } from "@/lib/format";
import { recipientDetail } from "@/lib/recipients";
import { useStore } from "@/lib/store";
import { tr } from "@/lib/i18n";

export default function Recipients() {
  const { recipients } = useStore();
  const [q, setQ] = useState("");
  const list = recipients.filter((r) => r.fullName.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Screen footer={<Button title={tr("Ajouter un destinataire")} icon="plus" onPress={() => router.push("/recipients/new")} />}>
      <Header title={tr("Mes destinataires")} />
      {recipients.length > 3 ? <Field label={tr("Rechercher")} placeholder={tr("Rechercher un destinataire")} value={q} onChangeText={setQ} /> : null}
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
          <Empty icon="user" title={recipients.length ? tr("Aucun résultat") : tr("Aucun destinataire")} text={tr("Enregistrez vos proches pour leur envoyer de l'argent en un geste.")} />
        )}
      </Card>
      <View style={{ height: 8 }} />
    </Screen>
  );
}
