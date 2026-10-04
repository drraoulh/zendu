import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";

export default function Index() {
  const { profile, locked, onboarded } = useSession();
  if (!profile) return <Redirect href={onboarded ? "/auth/login" : "/welcome"} />;
  if (locked) return <Redirect href="/lock" />;
  if (profile.mustChangePassword) return <Redirect href="/auth/reset" />;
  if (profile.kyc === "none" || profile.kyc === "rejected") return <Redirect href="/kyc" />;
  return <Redirect href="/(tabs)" />;
}
