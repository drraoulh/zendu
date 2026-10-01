import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthFallback } from "@/components/auth/auth-fallback";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthScreen mode="signup" />
    </Suspense>
  );
}
