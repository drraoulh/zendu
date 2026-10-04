import { useSession } from "./session";
import { useStore } from "./store";
import { buildNotifications } from "./notifications";
import { useMyTransfers } from "./use-transfers";

export function useNotifications() {
  const { profile } = useSession();
  const { requests, readNotifications, markRead } = useStore();
  const { items, reload } = useMyTransfers();
  const list = buildNotifications(items, profile, requests);
  const unread = list.filter((n) => !readNotifications.includes(n.id));
  return { list, unread, isRead: (id: string) => readNotifications.includes(id), markAllRead: () => markRead(list.map((n) => n.id)), markRead, reload };
}
