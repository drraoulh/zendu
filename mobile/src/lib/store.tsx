import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BeneficiaryInput, Quote } from "./api";
import { storage } from "./storage";

/** Bénéficiaire enregistré sur l'appareil (le numéro de compte complet n'est gardé que localement). */
export type Recipient = BeneficiaryInput & { id: string; country: string; relation?: string };

/** Carte enregistrée : seuls la marque, les 4 derniers chiffres et l'expiration sont conservés. */
export type SavedCard = { id: string; brand: "Visa" | "Mastercard" | "Amex" | "Carte"; last4: string; exp: string; holder: string; isDefault: boolean };

/** Demande de service envoyée depuis l'appli (contact, réinitialisation…). */
export type ServiceRequest = {
  reference: string;
  kind: "shipping_quote" | "finance_appointment" | "tech_project" | "contact";
  createdAt: string;
  summary: Record<string, string>;
};

export type SentTransfer = { id: string; reference: string; createdAt: string };

export type Draft = {
  corridorId: string;
  sendAmount: number;
  quote: Quote | null;
  recipient: Recipient | null;
  cardId: string | null;
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
  cards: SavedCard[];
  saveCard: (c: Omit<SavedCard, "id">) => SavedCard;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  requests: ServiceRequest[];
  addRequest: (r: ServiceRequest) => void;
  readNotifications: string[];
  markRead: (ids: string[]) => void;
  clearAll: () => void;
};

const KEY_RECIPIENTS = "wst.recipients";
const KEY_TRANSFERS = "wst.transfers";
const KEY_CARDS = "wst.cards";
const KEY_REQUESTS = "wst.requests";
const KEY_READ = "wst.read";

export const DEFAULT_CORRIDOR = "CA-CM";
const EMPTY_DRAFT: Draft = { corridorId: DEFAULT_CORRIDOR, sendAmount: 200, quote: null, recipient: null, cardId: null };

const StoreContext = createContext<StoreValue | null>(null);

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>(EMPTY_DRAFT);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [transfers, setTransfers] = useState<SentTransfer[]>([]);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [readNotifications, setRead] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      setRecipients((await storage.get<Recipient[]>(KEY_RECIPIENTS)) ?? []);
      setTransfers((await storage.get<SentTransfer[]>(KEY_TRANSFERS)) ?? []);
      setCards((await storage.get<SavedCard[]>(KEY_CARDS)) ?? []);
      setRequests((await storage.get<ServiceRequest[]>(KEY_REQUESTS)) ?? []);
      setRead((await storage.get<string[]>(KEY_READ)) ?? []);
    })();
  }, []);

  const persistCards = useCallback((update: (list: SavedCard[]) => SavedCard[]) => {
    setCards((list) => {
      const next = update(list);
      void storage.set(KEY_CARDS, next);
      return next;
    });
  }, []);

  const saveCard = useCallback(
    (c: Omit<SavedCard, "id">) => {
      const saved: SavedCard = { ...c, id: uid() };
      persistCards((list) => {
        const isDefault = c.isDefault || list.length === 0;
        return [{ ...saved, isDefault }, ...list.map((x) => (isDefault ? { ...x, isDefault: false } : x))].slice(0, 6);
      });
      return saved;
    },
    [persistCards],
  );

  const removeCard = useCallback(
    (id: string) =>
      persistCards((list) => {
        const next = list.filter((x) => x.id !== id);
        if (next.length && !next.some((x) => x.isDefault)) next[0] = { ...next[0], isDefault: true };
        return next;
      }),
    [persistCards],
  );

  const setDefaultCard = useCallback(
    (id: string) => persistCards((list) => list.map((x) => ({ ...x, isDefault: x.id === id }))),
    [persistCards],
  );

  const addRequest = useCallback((r: ServiceRequest) => {
    setRequests((list) => {
      const next = [r, ...list.filter((x) => x.reference !== r.reference)].slice(0, 30);
      void storage.set(KEY_REQUESTS, next);
      return next;
    });
  }, []);

  const markRead = useCallback((ids: string[]) => {
    setRead((list) => {
      const next = [...new Set([...list, ...ids])].slice(-300);
      void storage.set(KEY_READ, next);
      return next;
    });
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
    setCards([]);
    setRequests([]);
    setRead([]);
    setDraftState(EMPTY_DRAFT);
    for (const k of [KEY_RECIPIENTS, KEY_TRANSFERS, KEY_CARDS, KEY_REQUESTS, KEY_READ]) void storage.remove(k);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      resetDraft,
      recipients,
      saveRecipient,
      removeRecipient,
      transfers,
      addTransfer,
      cards,
      saveCard,
      removeCard,
      setDefaultCard,
      requests,
      addRequest,
      readNotifications,
      markRead,
      clearAll,
    }),
    [draft, setDraft, resetDraft, recipients, saveRecipient, removeRecipient, transfers, addTransfer, cards, saveCard, removeCard, setDefaultCard, requests, addRequest, readNotifications, markRead, clearAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
