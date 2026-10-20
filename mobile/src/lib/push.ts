import Constants from "expo-constants";
import * as Device from "expo-device";
import { router } from "expo-router";
import { Platform } from "react-native";
import { api } from "./api";
import { storage } from "./storage";

/**
 * Notifications push (service push d'Expo). Le serveur prévient le client à chaque étape de son
 * transfert (paiement reçu, argent livré, incident) et quand son identité est vérifiée.
 *
 * Il faut l'identifiant du projet EAS (« eas init » une fois, ou EXPO_PUBLIC_EAS_PROJECT_ID).
 * Expo Go sur Android ne reçoit plus de push depuis le SDK 53 : il faut l'APK. Sur iPhone, Expo Go
 * fonctionne une fois le projet EAS créé.
 */
const KEY_PUSH = "wst.pushToken";

type NotificationsModule = typeof import("expo-notifications");
let mod: NotificationsModule | null | undefined;
function notifications(): NotificationsModule | null {
  if (mod !== undefined) return mod;
  try {
    // Chargé à la demande : une ancienne version de l'appli sans le module natif ne plante pas.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = Platform.OS === "web" ? null : (require("expo-notifications") as NotificationsModule);
  } catch {
    mod = null;
  }
  return mod;
}

export function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? null;
}

let configured = false;
/** Affichage des notifications appli ouverte + ouverture du transfert concerné au toucher. */
export function configurePush() {
  const N = notifications();
  if (!N || configured) return;
  configured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  const open = (data: unknown) => {
    const id = data && typeof data === "object" ? (data as { transferId?: unknown }).transferId : undefined;
    if (typeof id === "string" && id) router.push({ pathname: "/transfer/[id]", params: { id } });
  };
  N.addNotificationResponseReceivedListener((r) => open(r.notification.request.content.data));
  // Appli lancée par le toucher d'une notification.
  void N.getLastNotificationResponseAsync()
    .then((r) => r && open(r.notification.request.content.data))
    .catch(() => undefined);
}

export type PushStatus = "on" | "denied" | "unavailable";

/**
 * Demande l'autorisation (une seule fois à l'écran système) puis enregistre le jeton de cet appareil
 * sur le compte connecté. `ask: false` : n'affiche pas la demande, met seulement le jeton à jour.
 */
export async function registerPush(lang: string, ask = true): Promise<PushStatus> {
  const N = notifications();
  const id = projectId();
  if (!N || !Device.isDevice || !id) return "unavailable";
  try {
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync("transfers", { name: "Transferts", importance: N.AndroidImportance.HIGH });
    }
    let { status } = await N.getPermissionsAsync();
    if (status !== "granted" && ask) status = (await N.requestPermissionsAsync()).status;
    if (status !== "granted") return "denied";
    const { data: token } = await N.getExpoPushTokenAsync({ projectId: id });
    await api.registerPush(token, Platform.OS === "ios" ? "ios" : "android", lang);
    await storage.set(KEY_PUSH, token);
    return "on";
  } catch {
    // Expo Go Android, pas de réseau, service push indisponible…
    return "unavailable";
  }
}

/** Déconnexion ou désactivation : l'appareil ne reçoit plus les notifications de ce compte. */
export async function unregisterPush(sessionToken?: string | null) {
  const token = await storage.get<string>(KEY_PUSH);
  if (!token) return;
  await api.unregisterPush(token, sessionToken ?? undefined).catch(() => undefined);
  await storage.remove(KEY_PUSH);
}
