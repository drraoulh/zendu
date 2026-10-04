import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

export default function Index() {
  const { profile } = useSession();
  if (!profile) return <Redirect href="/welcome" />;
  if (profile.kyc === "none") return <Redirect href="/kyc" />;
  return <Redirect href="/(tabs)" />;
}
