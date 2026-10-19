import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBanner } from "@/components/layout/demo-banner";
import { SiteChrome } from "@/components/layout/site-chrome";
import { isLiveMode } from "@/lib/mode";
import { appFullName, appName, logo } from "@/lib/brand";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const description =
  "Transfert d'argent entre le Canada, le Cameroun et la Chine, finances, technologies et shipping. Plus qu'un service, une solution pour votre avenir.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — ${appFullName}`,
    template: `%s · ${appName}`,
  },
  description,
  openGraph: {
    title: `${appName} — ${appFullName}`,
    description,
    url: appUrl,
    siteName: appName,
    images: [{ url: logo.og, width: 1200, height: 630 }],
    locale: "fr_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — ${appFullName}`,
    description,
    images: [logo.og],
  },
};

export const viewport: Viewport = {
  themeColor: "#061a52",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = !isLiveMode();
  return (
    <html lang="fr" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <I18nProvider>
          <AuthProvider>
            <SiteChrome>
              <SiteHeader />
              {demo && <DemoBanner />}
            </SiteChrome>
            <main className="flex-1">{children}</main>
            <SiteChrome>
              <SiteFooter />
            </SiteChrome>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
