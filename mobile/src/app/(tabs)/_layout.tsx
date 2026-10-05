import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import { Icon, type IconName } from "@/components/icons";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Accueil", icon: "home" },
  { name: "send", title: "Envoyer", icon: "send" },
  { name: "history", title: "Historique", icon: "history" },
  { name: "parcels", title: "Colis", icon: "ship" },
  { name: "profile", title: "Profil", icon: "user" },
];

export default function TabsLayout() {
  const { profile, locked } = useSession();
  // 5 onglets sur 320 px : « Historique » et « Découvrir » étaient tronqués en 11 px.
  const narrow = useWindowDimensions().width < 360;

  // Sans session (lien direct, rechargement) : retour à l'accueil. Différé pour laisser l'écran
  // qui déconnecte naviguer lui-même — une <Redirect> immédiate ici bouclerait avec la sienne.
  useEffect(() => {
    if (profile) return;
    const t = setTimeout(() => router.replace("/"), 150);
    return () => clearTimeout(t);
  }, [profile]);

  if (!profile) return null;
  if (locked) return <Redirect href="/lock" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: narrow ? 10 : 11, lineHeight: 15 },
        tabBarItemStyle: narrow ? { paddingHorizontal: 0 } : undefined,
        tabBarStyle: { borderTopColor: colors.line, backgroundColor: colors.white, ...(Platform.OS === "web" ? { height: 62, paddingBottom: 6 } : null) },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused }) => <Icon name={t.icon} color={String(color)} strokeWidth={focused ? 2.3 : 1.9} />,
          }}
        />
      ))}
    </Tabs>
  );
}
