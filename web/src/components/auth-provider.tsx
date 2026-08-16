"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type DemoUser = { id: string; email: string; name: string };

type AuthContextValue = {
  user: User | DemoUser | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_KEY = "zendu_demo_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!configured) {
        try {
          const raw = window.localStorage.getItem(DEMO_KEY);
          if (raw && mounted) setUser(JSON.parse(raw) as DemoUser);
        } catch {
          /* ignore */
        }
        if (mounted) setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setUser(data.user);
        setLoading(false);
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => sub.subscription.unsubscribe();
    }

    const cleanup = boot();
    return () => {
      mounted = false;
      void cleanup.then((fn) => fn?.());
    };
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        const demo: DemoUser = {
          id: "demo",
          email,
          name: email.split("@")[0] || "Utilisateur",
        };
        window.localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
        setUser(demo);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    [configured],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      if (!configured) {
        const demo: DemoUser = { id: "demo", email, name };
        window.localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
        setUser(demo);
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
    },
    [configured],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      throw new Error(
        "Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY pour Google.",
      );
    }
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) throw error;
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) {
      window.localStorage.removeItem(DEMO_KEY);
      setUser(null);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [configured]);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, configured, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function displayName(user: User | DemoUser | null) {
  if (!user) return "";
  if ("user_metadata" in user) {
    return (
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      "Compte"
    );
  }
  return user.name || user.email;
}
