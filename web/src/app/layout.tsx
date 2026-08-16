import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Zendu";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} — International money transfer`,
    template: `%s · ${appName}`,
  },
  description:
    "Send money worldwide with live rates, clear fees, mobile money delivery, and multi-language support.",
  openGraph: {
    title: `${appName} — International money transfer`,
    description:
      "Send money worldwide with live rates, clear fees, and mobile money delivery.",
    url: appUrl,
    siteName: appName,
    images: [{ url: "/hero-zendu.jpg", width: 1200, height: 630 }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} — International money transfer`,
    description:
      "Send money worldwide with live rates, clear fees, and mobile money delivery.",
    images: ["/hero-zendu.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${sora.variable} ${dmSans.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <I18nProvider>
          <AuthProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
