import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Badge, Button, Card, Header, ListItem, Notice, P, Screen } from "@/components/ui";
import { api, type DeviceSession } from "@/lib/api";
import { dateTime } from "@/lib/format";
import { colors } from "@/lib/theme";
import { tr } from "@/lib/i18n";

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
      setError(e instanceof Error ? e.message : tr("Action impossible"));
    }
  }

  const others = list?.filter((s) => !s.current) ?? [];

  return (
    <Screen>
      <Header title={tr("Appareils connectés")} />
      <P style={{ marginBottom: 16 }}>{tr("Ces appareils ont accès à votre compte. Déconnectez ceux que vous ne reconnaissez pas.")}</P>
      {error ? (
        <View style={{ marginBottom: 12 }}>
          <Notice tone="danger" icon="alert" text={error} />
        </View>
      ) : null}
      {!list ? (
        // Échec du premier chargement : bouton « Réessayer » au lieu d'un chargement sans fin.
        error ? (
          <Button title={tr("Réessayer")} variant="secondary" onPress={load} />
        ) : (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} />
        )
      ) : (
        <Card style={{ paddingVertical: 4, marginBottom: 14 }}>
          {list.map((s) => (
            <ListItem
              key={s.id}
              icon={/navigateur|windows|mac/i.test(s.device ?? "") ? "tech" : "phone"}
              title={s.device ?? tr("Appareil inconnu")}
              subtitle={s.current ? tr("Actif maintenant") : tr("Actif le {0}", dateTime(s.lastUsedAt))}
              // Badge / bouton sous le texte : à droite, ils écrasaient le nom de l'appareil sur petit écran.
              extra={
                <View style={{ marginTop: 6, alignItems: "flex-start" }}>
                  {s.current ? <Badge label={tr("Cet appareil")} tone="success" /> : <Button title={tr("Déconnecter")} size="sm" variant="secondary" onPress={() => revoke(s.id)} />}
                </View>
              }
              right={<View />}
            />
          ))}
        </Card>
      )}
      {others.length > 1 ? <Button title={tr("Déconnecter tous les autres appareils")} variant="danger" onPress={() => revoke()} /> : null}
      <View style={{ marginTop: 12 }}>
        <Notice tone="neutral" icon="info" text={tr("Un appareil inconnu ? Déconnectez-le, puis changez votre mot de passe.")} />
      </View>
    </Screen>
  );
}
