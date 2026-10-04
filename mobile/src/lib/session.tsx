import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { storage } from "./storage";

/**
 * Compte client — version démo stockée sur l'appareil.
 * À brancher sur Supabase Auth (même projet que le site) avant la mise en production.
 */
export type KycStatus = "none" | "pending" | "verified";

export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  kyc: KycStatus;
  createdAt: string;
};

type SessionValue = {
  ready: boolean;
  profile: Profile | null;
  onboarded: boolean;
  signUp: (p: Omit<Profile, "kyc" | "createdAt">) => Promise<void>;
  signIn: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
};

const KEY_PROFILE = "wst.profile";
const KEY_ACCOUNT = "wst.account";
const KEY_ONBOARDED = "wst.onboarded";

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    void (async () => {
      const [p, o] = await Promise.all([storage.get<Profile>(KEY_PROFILE), storage.get<boolean>(KEY_ONBOARDED)]);
      setProfile(p);
      setOnboarded(Boolean(o));
      setReady(true);
    })();
  }, []);

  const save = useCallback(async (p: Profile | null) => {
    setProfile(p);
    if (p) {
      await storage.set(KEY_PROFILE, p);
      await storage.set(KEY_ACCOUNT, p);
    } else {
      await storage.remove(KEY_PROFILE);
    }
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      profile,
      onboarded,
      signUp: async (p) => save({ ...p, email: p.email.trim().toLowerCase(), kyc: "none", createdAt: new Date().toISOString() }),
      signIn: async (email) => {
        const account = await storage.get<Profile>(KEY_ACCOUNT);
        if (!account || account.email !== email.trim().toLowerCase()) return false;
        await save(account);
        return true;
      },
      signOut: async () => save(null),
      update: async (patch) => {
        if (profile) await save({ ...profile, ...patch });
      },
      finishOnboarding: async () => {
        setOnboarded(true);
        await storage.set(KEY_ONBOARDED, true);
      },
    }),
    [ready, profile, onboarded, save],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
