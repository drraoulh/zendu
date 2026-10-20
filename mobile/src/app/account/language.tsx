import { router } from "expo-router";
import { View } from "react-native";
import { SectionTitle } from "@/components/form";
import { Card, Choice, Header, Notice, Screen, SummaryRow } from "@/components/ui";
import { COUNTRIES, type CountryCode } from "@/lib/corridors";
import { getLang, tr, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/session";

/** Nom de chaque langue dans sa propre langue, puis dans la langue de l'appli. */
const LANGS: { id: Lang; label: string; sub: string }[] = [
  { id: "fr", label: "Français", sub: "Français" },
  { id: "en", label: "English", sub: "Anglais" },
  { id: "es", label: "Español", sub: "Espagnol" },
  { id: "zh", label: "中文", sub: "Chinois simplifié" },
];

const CURRENCY_NAMES: Record<string, string> = { CAD: "Dollar canadien (CAD)", XAF: "Franc CFA (XAF)", CNY: "Yuan chinois (CNY)" };

export default function Language() {
  const { profile, settings, updateSettings } = useSession();
  const cur = COUNTRIES[(profile?.country ?? "CA") as CountryCode].currency;
  const dot = getLang() === "en" || getLang() === "zh";

  async function choose(lang: Lang) {
    if (lang === settings.language) return;
    await updateSettings({ language: lang });
    // L'appli est redessinée dans la nouvelle langue : on revient sur cet écran.
    setTimeout(() => router.push("/account/language"), 50);
  }

  return (
    <Screen>
      <Header title={tr("Langue et région")} />
      <SectionTitle>{tr("Langue de l'appli")}</SectionTitle>
      {LANGS.map((l) => (
        <Choice key={l.id} label={l.label} description={tr(l.sub)} selected={settings.language === l.id} onPress={() => void choose(l.id)} />
      ))}
      <View style={{ marginTop: 4 }}>
        <Notice tone="neutral" icon="globe" text={tr("Les notifications push suivent aussi la langue choisie ici.")} />
      </View>
      <SectionTitle>{tr("Devise et format")}</SectionTitle>
      <Card>
        <SummaryRow label={tr("Devise")} value={CURRENCY_NAMES[cur] ? tr(CURRENCY_NAMES[cur]) : cur} />
        <SummaryRow label={tr("Date")} value={tr("JJ/MM/AAAA")} />
        <SummaryRow label={tr("Nombres")} value={dot ? "1,234.56" : "1 234,56"} />
        <SummaryRow label={tr("Heure")} value={tr("14:05 (24 h)")} />
      </Card>
    </Screen>
  );
}
