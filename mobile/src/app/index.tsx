import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

export default function Index() {
  const { profile, locked, onboarded, hasAccount } = useSession();
  if (!profile) return <Redirect href={onboarded && hasAccount ? "/auth/login" : "/welcome"} />;
  if (locked) return <Redirect href="/lock" />;
  if (profile.kyc === "none") return <Redirect href="/kyc" />;
  return <Redirect href="/(tabs)" />;
}
