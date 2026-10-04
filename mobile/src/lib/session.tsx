import * as Crypto from "expo-crypto";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { storage } from "./storage";

/**
 * Compte client — version démo stockée sur l'appareil (mot de passe et PIN hachés).
 * À brancher sur Supabase Auth (même projet que le site) avant la mise en production.
 */
export type KycStatus = "none" | "pending" | "verified";

export type Address = { line1: string; line2?: string; city: string; region: string; postalCode?: string };

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  region?: string;
  birthDate?: string;
  occupation?: string;
  jobTitle?: string;
  address?: Address;
  marketing?: boolean;
  kyc: KycStatus;
  kycDocument?: string;
  kycVerifiedAt?: string;
  createdAt: string;
  passwordChangedAt?: string;
};

export type NotificationPrefs = {
  transfers: boolean;
  rates: boolean;
  shipping: boolean;
  finance: boolean;
  offers: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
};

export type Settings = {
  twoFactor: boolean;
  biometric: boolean;
  pin: boolean;
  language: "fr" | "en" | "es" | "zh";
  notifications: NotificationPrefs;
};

export const DEFAULT_SETTINGS: Settings = {
  twoFactor: true,
  biometric: false,
  pin: false,
  language: "fr",
  notifications: { transfers: true, rates: true, shipping: true, finance: true, offers: false, push: true, email: true, sms: false },
};

type Account = { profile: Profile; passwordHash: string; pinHash?: string };

type SessionValue = {
  ready: boolean;
  profile: Profile | null;
  settings: Settings;
  onboarded: boolean;
  /** Vrai quand un PIN est actif et que l'appli n'a pas encore été déverrouillée. */
  locked: boolean;
  hasAccount: boolean;
  accountFirstName: string | null;
  accountContact: { phone: string; email: string } | null;
  signUp: (p: Omit<Profile, "kyc" | "createdAt">, password: string) => Promise<void>;
  checkPassword: (email: string, password: string) => Promise<boolean>;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<boolean>;
  resetPassword: (email: string, next: string) => Promise<boolean>;
  setPin: (pin: string | null) => Promise<void>;
  checkPin: (pin: string) => Promise<boolean>;
  unlock: () => void;
  finishOnboarding: () => Promise<void>;
};

const KEY_ACCOUNT = "wst.account";
const KEY_SIGNED_IN = "wst.signedin";
const KEY_SETTINGS = "wst.settings";
const KEY_ONBOARDED = "wst.onboarded";

const SessionContext = createContext<SessionValue | null>(null);

function hash(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `wst:${value}`);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [onboarded, setOnboarded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    void (async () => {
      const [a, s, st, o] = await Promise.all([
        storage.get<Account>(KEY_ACCOUNT),
        storage.get<boolean>(KEY_SIGNED_IN),
        storage.get<Settings>(KEY_SETTINGS),
        storage.get<boolean>(KEY_ONBOARDED),
      ]);
      setAccount(a?.profile ? a : null);
      setSignedIn(Boolean(s && a?.profile));
      if (st) setSettings({ ...DEFAULT_SETTINGS, ...st, notifications: { ...DEFAULT_SETTINGS.notifications, ...st.notifications } });
      setOnboarded(Boolean(o));
      setReady(true);
    })();
  }, []);

  const saveAccount = useCallback(async (a: Account | null) => {
    setAccount(a);
    if (a) await storage.set(KEY_ACCOUNT, a);
    else await storage.remove(KEY_ACCOUNT);
  }, []);

  // Démo : une vérification d'identité soumise est validée automatiquement après quelques secondes.
  // En production, c'est le webhook du prestataire KYC qui fait passer le statut à « verified ».
  const pending = account?.profile.kyc === "pending";
  useEffect(() => {
    if (!pending || !account) return;
    const t = setTimeout(() => {
      void saveAccount({ ...account, profile: { ...account.profile, kyc: "verified", kycVerifiedAt: new Date().toISOString() } });
    }, 8000);
    return () => clearTimeout(t);
  }, [pending, account, saveAccount]);

  const setSigned = useCallback(async (v: boolean) => {
    setSignedIn(v);
    setUnlocked(v);
    await storage.set(KEY_SIGNED_IN, v);
  }, []);

  const value = useMemo<SessionValue>(() => {
    const profile = signedIn && account ? account.profile : null;
    return {
      ready,
      profile,
      settings,
      onboarded,
      locked: Boolean(profile && settings.pin && account?.pinHash && !unlocked),
      hasAccount: Boolean(account),
      accountFirstName: account?.profile.firstName ?? null,
      accountContact: account ? { phone: account.profile.phone, email: account.profile.email } : null,
      signUp: async (p, password) => {
        await saveAccount({
          profile: { ...p, email: p.email.trim().toLowerCase(), kyc: "none", createdAt: new Date().toISOString() },
          passwordHash: await hash(password),
        });
        await setSigned(true);
      },
      checkPassword: async (email, password) =>
        Boolean(account && account.profile.email === email.trim().toLowerCase() && account.passwordHash === (await hash(password))),
      signIn: async () => {
        if (!account) return false;
        await setSigned(true);
        return true;
      },
      signOut: async () => setSigned(false),
      deleteAccount: async () => {
        await setSigned(false);
        await saveAccount(null);
        await storage.remove(KEY_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      },
      update: async (patch) => {
        if (account) await saveAccount({ ...account, profile: { ...account.profile, ...patch } });
      },
      updateSettings: async (patch) => {
        const next = { ...settings, ...patch, notifications: { ...settings.notifications, ...patch.notifications } };
        setSettings(next);
        await storage.set(KEY_SETTINGS, next);
      },
      changePassword: async (current, next) => {
        if (!account || account.passwordHash !== (await hash(current))) return false;
        await saveAccount({
          ...account,
          passwordHash: await hash(next),
          profile: { ...account.profile, passwordChangedAt: new Date().toISOString() },
        });
        return true;
      },
      resetPassword: async (email, next) => {
        if (!account || account.profile.email !== email.trim().toLowerCase()) return false;
        await saveAccount({
          ...account,
          passwordHash: await hash(next),
          profile: { ...account.profile, passwordChangedAt: new Date().toISOString() },
        });
        return true;
      },
      setPin: async (pin) => {
        if (!account) return;
        await saveAccount({ ...account, pinHash: pin ? await hash(`pin:${pin}`) : undefined });
        const next = { ...settings, pin: Boolean(pin) };
        setSettings(next);
        await storage.set(KEY_SETTINGS, next);
      },
      checkPin: async (pin) => Boolean(account?.pinHash && account.pinHash === (await hash(`pin:${pin}`))),
      unlock: () => setUnlocked(true),
      finishOnboarding: async () => {
        setOnboarded(true);
        await storage.set(KEY_ONBOARDED, true);
      },
    };
  }, [ready, account, signedIn, settings, onboarded, unlocked, saveAccount, setSigned]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** Règles de mot de passe communes (inscription, changement, réinitialisation). */
export const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "Au moins 8 caractères", test: (v) => v.length >= 8 },
  { label: "Une majuscule et une minuscule", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "Au moins un chiffre", test: (v) => /\d/.test(v) },
  { label: "Un caractère spécial (! ? @ # …)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function passwordScore(v: string) {
  return PASSWORD_RULES.filter((r) => r.test(v)).length;
}

export function referralCode(p: Profile) {
  const base = p.firstName.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6) || "AMI";
  return `WST-${base}`;
}
