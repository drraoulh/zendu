import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { api, type Transfer } from "./api";
import { useSession } from "./session";

/** Transferts du compte (tous appareils), rechargés à chaque affichage de l'écran. */
export function useMyTransfers(limit?: number) {
  const { profile } = useSession();
  const [all, setAll] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const signedIn = Boolean(profile);

  const load = useCallback(async () => {
    if (!signedIn) {
      setAll([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setAll(await api.myTransfers());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [signedIn]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const items = limit ? all.slice(0, limit) : all;
  return { items, loading, failed, reload: load, count: all.length };
}
