import { Suspense } from "react";
import SendPage from "./send-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-5 py-12 text-ink-muted">
          Chargement...
        </div>
      }
    >
      <SendPage />
    </Suspense>
  );
}
