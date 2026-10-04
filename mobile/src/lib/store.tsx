import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BeneficiaryInput, Quote } from "./api";
import { storage } from "./storage";

/** Bénéficiaire enregistré sur l'appareil (le numéro de compte complet n'est gardé que localement). */
export type Recipient = BeneficiaryInput & { id: string; country: string };

export type SentTransfer = { id: string; reference: string; createdAt: string };

export type Draft = {
  corridorId: string;
  sendAmount: number;
  quote: Quote | null;
  recipient: Recipient | null;
};

type StoreValue = {
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
  recipients: Recipient[];
  saveRecipient: (r: Omit<Recipient, "id"> & { id?: string }) => Recipient;
  removeRecipient: (id: string) => void;
  transfers: SentTransfer[];
  addTransfer: (t: SentTransfer) => void;
  clearAll: () => void;
};

const KEY_RECIPIENTS = "wst.recipients";
const KEY_TRANSFERS = "wst.transfers";

export const DEFAULT_CORRIDOR = "CA-CM";
const EMPTY_DRAFT: Draft = { corridorId: DEFAULT_CORRIDOR, sendAmount: 200, quote: null, recipient: null };

const StoreContext = createContext<StoreValue | null>(null);

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [transfers, setTransfers] = useState<SentTransfer[]>([]);

  useEffect(() => {
    void (async () => {
      setRecipients((await storage.get<Recipient[]>(KEY_RECIPIENTS)) ?? []);
      setTransfers((await storage.get<SentTransfer[]>(KEY_TRANSFERS)) ?? []);
    })();
  }, []);

  const setDraft = useCallback((patch: Partial<Draft>) => setDraftState((d) => ({ ...d, ...patch })), []);
  const resetDraft = useCallback(() => setDraftState((d) => ({ ...EMPTY_DRAFT, corridorId: d.corridorId })), []);

  const saveRecipient = useCallback((r: Omit<Recipient, "id"> & { id?: string }) => {
    const saved: Recipient = { ...r, id: r.id ?? uid() };
    setRecipients((list) => {
      const next = [saved, ...list.filter((x) => x.id !== saved.id)].slice(0, 20);
      void storage.set(KEY_RECIPIENTS, next);
      return next;
    });
    return saved;
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setRecipients((list) => {
      const next = list.filter((x) => x.id !== id);
      void storage.set(KEY_RECIPIENTS, next);
      return next;
    });
  }, []);

  const addTransfer = useCallback((t: SentTransfer) => {
    setTransfers((list) => {
      const next = [t, ...list.filter((x) => x.id !== t.id)].slice(0, 50);
      void storage.set(KEY_TRANSFERS, next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setRecipients([]);
    setTransfers([]);
    setDraftState(EMPTY_DRAFT);
    void storage.remove(KEY_RECIPIENTS);
    void storage.remove(KEY_TRANSFERS);
  }, []);

  const value = useMemo(
    () => ({ draft, setDraft, resetDraft, recipients, saveRecipient, removeRecipient, transfers, addTransfer, clearAll }),
    [draft, setDraft, resetDraft, recipients, saveRecipient, removeRecipient, transfers, addTransfer, clearAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
