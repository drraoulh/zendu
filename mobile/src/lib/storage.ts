import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Stockage clé/valeur : Keychain / Keystore sur mobile, localStorage sur le web. */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = Platform.OS === "web" ? globalThis.localStorage?.getItem(key) : await SecureStore.getItemAsync(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    try {
      const raw = JSON.stringify(value);
      if (Platform.OS === "web") globalThis.localStorage?.setItem(key, raw);
      else await SecureStore.setItemAsync(key, raw);
    } catch {
      /* stockage indisponible : on garde l'état en mémoire */
    }
  },
  async remove(key: string) {
    try {
      if (Platform.OS === "web") globalThis.localStorage?.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};
