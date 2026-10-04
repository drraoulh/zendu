import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { api, setAuthToken, setUnauthorizedHandler, type Customer, type SignupInput } from "./api";
import { storage } from "./storage";

/**
 * Compte client — stocké sur le serveur PWFINTECH (/api/auth, /api/me).
 * L'appareil ne garde que le jeton de session (Keychain / Keystore), une copie du profil pour
 * l'affichage hors ligne, les réglages et le code PIN (haché) propres à cet appareil.
 */
export type Profile = Customer;
export type KycStatus = Customer["kyc"];

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

type Pending = { token: string; customer: Customer; password: string };

type Result = { ok: true } | { ok: false; error: string };

type SessionValue = {
  ready: boolean;
  profile: Profile | null;
  settings: Settings;
  onboarded: boolean;
  /** Vrai quand un PIN ou la biométrie protège l'appli et qu'elle n'a pas encore été déverrouillée. */
  locked: boolean;
  /** Connexion en cours (après le mot de passe, avant le code de vérification). */
  pending: { phone: string; email: string; mustChangePassword: boolean } | null;
  signUp: (p: Omit<SignupInput, "device" | "password">, password: string) => Promise<Result>;
  /** Étape 1 : mot de passe. needsCode = vérification en deux étapes à faire ensuite. */
  startSignIn: (email: string, password: string) => Promise<Result & { needsCode?: boolean; mustChangePassword?: boolean }>;
  /** Étape 2 : code validé → session active. */
  completeSignIn: () => Promise<{ mustChangePassword: boolean }>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<Result>;
  refresh: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<Result>;
  submitKyc: (document: string) => Promise<Result>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<Result>;
  /** Mot de passe temporaire donné par l'équipe : à remplacer juste après la connexion. */
  replaceTemporaryPassword: (next: string) => Promise<Result>;
  setPin: (pin: string | null) => Promise<void>;
  checkPin: (pin: string) => Promise<boolean>;
  unlock: () => void;
  finishOnboarding: () => Promise<void>;
};

const KEY_TOKEN = "wst.token";
const KEY_PROFILE = "wst.profile";
const KEY_SETTINGS = "wst.settings";
const KEY_ONBOARDED = "wst.onboarded";
const KEY_PIN = "wst.pin";

const SessionContext = createContext<SessionValue | null>(null);

function hash(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `wst:${value}`);
}

export function deviceName() {
  const model = Device.modelName ?? (Platform.OS === "web" ? "Navigateur web" : "Téléphone");
  return [model, Device.osName, Device.osVersion].filter(Boolean).join(" · ");
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Une erreur est survenue.";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [onboarded, setOnboarded] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const tempPassword = useRef<string | null>(null);

  const clearSession = useCallback(async () => {
    setToken(null);
    setProfile(null);
    setAuthToken(null);
    setUnlocked(false);
    await storage.remove(KEY_TOKEN);
    await storage.remove(KEY_PROFILE);
  }, []);

  const saveProfile = useCallback(async (c: Customer) => {
    setProfile(c);
    await storage.set(KEY_PROFILE, c);
  }, []);

  useEffect(() => {
    void (async () => {
      const [t, p, st, o, pin] = await Promise.all([
        storage.get<string>(KEY_TOKEN),
        storage.get<Customer>(KEY_PROFILE),
        storage.get<Settings>(KEY_SETTINGS),
        storage.get<boolean>(KEY_ONBOARDED),
        storage.get<string>(KEY_PIN),
      ]);
      if (st) setSettings({ ...DEFAULT_SETTINGS, ...st, notifications: { ...DEFAULT_SETTINGS.notifications, ...st.notifications } });
      setOnboarded(Boolean(o));
      setPinHash(pin);
      if (t && p) {
        setAuthToken(t);
        setToken(t);
        setProfile(p);
      }
      setReady(true);
      // Profil à jour en arrière-plan (statut KYC validé par l'équipe, etc.).
      if (t) {
        api
          .me(t)
          .then((r) => saveProfile(r.customer))
          .catch(() => undefined);
      }
    })();
  }, [saveProfile]);

  // Session révoquée côté serveur (autre appareil, équipe, suspension) : retour à la connexion.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Identité en cours de vérification : on interroge le serveur régulièrement.
  const kycPending = profile?.kyc === "pending";
  useEffect(() => {
    if (!kycPending) return;
    const t = setInterval(() => {
      api
        .me()
        .then((r) => saveProfile(r.customer))
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(t);
  }, [kycPending, saveProfile]);

  const commit = useCallback(
    async (t: string, c: Customer) => {
      setAuthToken(t);
      setToken(t);
      setUnlocked(true);
      await storage.set(KEY_TOKEN, t);
      await saveProfile(c);
    },
    [saveProfile],
  );

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      profile: token ? profile : null,
      settings,
      onboarded,
      locked: Boolean(token && profile && !unlocked && ((settings.pin && pinHash) || settings.biometric) && Platform.OS !== "web"),
      pending: pending ? { phone: pending.customer.phone, email: pending.customer.email, mustChangePassword: pending.customer.mustChangePassword } : null,
      signUp: async (p, password) => {
        try {
          const r = await api.signup({ ...p, password, device: deviceName() });
          await commit(r.token, r.customer);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      startSignIn: async (email, password) => {
        try {
          const r = await api.login(email.trim().toLowerCase(), password, deviceName());
          if (settings.twoFactor) {
            setPending({ token: r.token, customer: r.customer, password });
            return { ok: true, needsCode: true, mustChangePassword: r.customer.mustChangePassword };
          }
          tempPassword.current = r.customer.mustChangePassword ? password : null;
          await commit(r.token, r.customer);
          return { ok: true, needsCode: false, mustChangePassword: r.customer.mustChangePassword };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      completeSignIn: async () => {
        if (!pending) return { mustChangePassword: false };
        tempPassword.current = pending.customer.mustChangePassword ? pending.password : null;
        await commit(pending.token, pending.customer);
        setPending(null);
        return { mustChangePassword: pending.customer.mustChangePassword };
      },
      signOut: async () => {
        if (token) await api.logout(token).catch(() => undefined);
        await clearSession();
      },
      deleteAccount: async (password) => {
        try {
          await api.deleteMe(password);
          await clearSession();
          return { ok: true };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      refresh: async () => {
        if (!token) return;
        const r = await api.me().catch(() => null);
        if (r) await saveProfile(r.customer);
      },
      update: async (patch) => {
        try {
          const r = await api.updateMe(patch);
          await saveProfile(r.customer);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      submitKyc: async (document) => {
        try {
          const r = await api.submitKyc(document);
          await saveProfile(r.customer);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      updateSettings: async (patch) => {
        const next = { ...settings, ...patch, notifications: { ...settings.notifications, ...patch.notifications } };
        setSettings(next);
        await storage.set(KEY_SETTINGS, next);
      },
      changePassword: async (current, next) => {
        try {
          const r = await api.changePassword(current, next);
          await saveProfile(r.customer);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      replaceTemporaryPassword: async (next) => {
        if (!tempPassword.current) return { ok: false, error: "Reconnectez-vous avec le mot de passe temporaire." };
        try {
          const r = await api.changePassword(tempPassword.current, next);
          tempPassword.current = null;
          await saveProfile(r.customer);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: message(e) };
        }
      },
      setPin: async (pin) => {
        const h = pin ? await hash(`pin:${pin}`) : null;
        setPinHash(h);
        if (h) await storage.set(KEY_PIN, h);
        else await storage.remove(KEY_PIN);
        const next = { ...settings, pin: Boolean(pin) };
        setSettings(next);
        await storage.set(KEY_SETTINGS, next);
      },
      checkPin: async (pin) => Boolean(pinHash && pinHash === (await hash(`pin:${pin}`))),
      unlock: () => setUnlocked(true),
      finishOnboarding: async () => {
        setOnboarded(true);
        await storage.set(KEY_ONBOARDED, true);
      },
    }),
    [ready, token, profile, settings, onboarded, unlocked, pinHash, pending, commit, clearSession, saveProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** Règles de mot de passe communes (identiques au serveur). */
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
