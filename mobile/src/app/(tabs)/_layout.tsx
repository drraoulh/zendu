import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { Tabs } from "expo-router/js-tabs";
import { Icon, type IconName } from "@/components/icons";
import { useSession } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: "index", title: "Accueil", icon: "home" },
  { name: "send", title: "Envoyer", icon: "send" },
  { name: "history", title: "Historique", icon: "history" },
  { name: "discover", title: "Services", icon: "grid" },
  { name: "profile", title: "Profil", icon: "user" },
];

export default function TabsLayout() {
  const { profile } = useSession();
  if (!profile) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15 },
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
