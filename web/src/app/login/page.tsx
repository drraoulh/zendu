import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AuthFallback } from "@/components/auth/auth-fallback";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
