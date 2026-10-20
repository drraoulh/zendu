import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Montserrat } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SiteProvider } from "@/components/site-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WstHeader } from "@/components/layout/wst-header";
import { WstFooter } from "@/components/layout/wst-footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { isLiveMode } from "@/lib/mode";
import { appFullName, appName, logo } from "@/lib/brand";
import { siteForHost, siteOrigin, type SiteId } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

async function currentHost() {
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host");
}

async function currentSite(): Promise<{ site: SiteId; origins: Record<SiteId, string> }> {
  const host = await currentHost();
  const site = siteForHost(host);
  const origin = (s: SiteId) => (s === site ? "" : (siteOrigin(s, host) ?? ""));
  return { site, origins: { pwfintech: origin("pwfintech"), wst: origin("wst") } };
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await currentHost();
  const site = siteForHost(host);
  const fallback = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const base = siteOrigin(site, host) ?? fallback;

  if (site === "wst") {
    const title = "WorldSoft Transfer — Canada · Cameroun · Chine";
    const description =
      "WorldSoft Transfer, l'application de transfert d'argent de PWFINTECH : sans frais vers le Cameroun, taux, frais et délai affichés avant de payer.";
    const og = "/brand/wst/og-image-1200x630.png";
    return {
      metadataBase: new URL(base),
      title: { default: title, template: "%s · WorldSoft Transfer" },
      description,
      icons: { icon: "/brand/wst/favicon.svg", apple: "/brand/wst/apple-touch-icon-180.png" },
      openGraph: { title, description, url: base, siteName: "WorldSoft Transfer", images: [{ url: og, width: 1200, height: 630 }], locale: "fr_CA", type: "website" },
      twitter: { card: "summary_large_image", title, description, images: [og] },
    };
  }

  const title = `${appName} — ${appFullName}`;
  const description =
    "Transfert d'argent, AVI pour visa études, paiement de fournisseurs, finances, technologies et shipping. Plus qu'un service, une solution pour votre avenir.";
  return {
    metadataBase: new URL(base),
    title: { default: title, template: `%s · ${appName}` },
    description,
    icons: { icon: "/brand/pwfintech-icon.png", apple: "/brand/pwfintech-apple-icon.png" },
    openGraph: { title, description, url: base, siteName: appName, images: [{ url: logo.og, width: 1200, height: 630 }], locale: "fr_CA", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [logo.og] },
  };
}

export const viewport: Viewport = {
  themeColor: "#061a52",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = !isLiveMode();
  const siteValue = await currentSite();
  const wst = siteValue.site === "wst";
  return (
    <html lang="fr" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteProvider value={siteValue}>
          <I18nProvider>
            <AuthProvider>
              <SiteChrome>
                {wst ? <WstHeader /> : <SiteHeader />}
                {demo && <DemoBanner />}
              </SiteChrome>
              <main className="flex-1">{children}</main>
              <SiteChrome>{wst ? <WstFooter /> : <SiteFooter />}</SiteChrome>
            </AuthProvider>
          </I18nProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
