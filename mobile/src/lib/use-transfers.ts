import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { api, type Transfer } from "./api";
import { useStore } from "./store";

/** Recharge, à chaque affichage de l'écran, les transferts faits depuis cet appareil. */
export function useMyTransfers(limit?: number) {
  const { transfers } = useStore();
  const [items, setItems] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const ids = (limit ? transfers.slice(0, limit) : transfers).map((t) => t.id);
    if (!ids.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.allSettled(ids.map((id) => api.transfer(id)));
    const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    setFailed(ok.length === 0 && results.length > 0);
    setItems(ok);
    setLoading(false);
  }, [transfers, limit]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { items, loading, failed, reload: load, count: transfers.length };
}
