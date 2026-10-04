import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Badge, Button, Card, Header, ListItem, Notice, P, Screen } from "@/components/ui";
import { api, type DeviceSession } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { colors } from "@/lib/theme";

export default function Devices() {
  const [list, setList] = useState<DeviceSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .sessions()
      .then((l) => {
        setList(l);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useFocusEffect(load);

  async function revoke(id?: string) {
    try {
      if (id) await api.revokeSession(id);
      else await api.revokeOtherSessions();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible");
    }
  }

  const others = list?.filter((s) => !s.current) ?? [];

  return (
    <Screen>
      <Header title="Appareils connectés" />
      <P style={{ marginBottom: 16 }}>Ces appareils ont accès à votre compte. Déconnectez ceux que vous ne reconnaissez pas.</P>
      {error ? (
        <View style={{ marginBottom: 12 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}
      {!list ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} />
      ) : (
        <Card style={{ paddingVertical: 4, marginBottom: 14 }}>
          {list.map((s) => (
            <ListItem
              key={s.id}
              icon={/navigateur|windows|mac/i.test(s.device ?? "") ? "tech" : "phone"}
              title={s.device ?? "Appareil inconnu"}
              subtitle={s.current ? "Cet appareil · actif maintenant" : `Actif le ${dateTime(s.lastUsedAt)}`}
              right={s.current ? <Badge label="Cet appareil" tone="success" /> : <Button title="Déconnecter" size="sm" variant="secondary" onPress={() => revoke(s.id)} />}
            />
          ))}
        </Card>
      )}
      {others.length > 1 ? <Button title="Déconnecter tous les autres appareils" variant="danger" onPress={() => revoke()} /> : null}
      <View style={{ marginTop: 12 }}>
        <Notice tone="neutral" icon="info" text="Un appareil inconnu ? Déconnectez-le, puis changez votre mot de passe." />
      </View>
    </Screen>
  );
}
