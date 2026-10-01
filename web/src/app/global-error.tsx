"use client";

/** Dernier filet de sécurité : remplace tout le layout racine, donc styles en ligne. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          boxSizing: "border-box",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#ffffff",
          background: "linear-gradient(160deg, #061a52 0%, #040f33 100%)",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 440 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/pwfintech-emblem.png"
            alt="PWFINTECH"
            width={120}
            height={68}
            style={{ background: "#ffffff", borderRadius: 16, padding: 8 }}
          />
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "28px 0 10px" }}>
            Un incident est survenu
          </h1>
          <p style={{ margin: 0, lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>
            Nous n&apos;avons pas pu charger le site. Veuillez réessayer.
            <br />
            <span lang="en">Something went wrong. Please try again.</span>
          </p>
          {error.digest && (
            <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Ref. {error.digest}</p>
          )}
          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: 15,
                background: "#0b4dff",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Réessayer · Retry
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                borderRadius: 999,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: 15,
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.3)",
                textDecoration: "none",
              }}
            >
              Accueil · Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
