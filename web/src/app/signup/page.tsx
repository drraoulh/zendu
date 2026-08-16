import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { SandboxBanner } from "@/components/sandbox-banner";

export default function SignupPage() {
  return (
    <div>
      <SandboxBanner />
      <Suspense fallback={<div className="p-10 text-center">…</div>}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
