import { SectionTitle } from "@/components/form";
import { Card, Choice, Header, Notice, Screen, SummaryRow } from "@/components/ui";
import { COUNTRIES, type CountryCode } from "@/lib/corridors";
import { useSession } from "@/lib/session";

const LANGS = [
  { id: "fr", label: "Français", sub: "Français", ready: true },
  { id: "en", label: "English", sub: "Anglais · bientôt", ready: false },
  { id: "es", label: "Español", sub: "Espagnol · bientôt", ready: false },
  { id: "zh", label: "中文", sub: "Chinois simplifié · bientôt", ready: false },
] as const;

export default function Language() {
  const { profile, settings, updateSettings } = useSession();
  const cur = COUNTRIES[(profile?.country ?? "CA") as CountryCode].currency;
  return (
    <Screen>
      <Header title="Langue et région" />
      <SectionTitle>Langue de l&apos;appli</SectionTitle>
      {LANGS.map((l) => (
        <Choice key={l.id} label={l.label} description={l.sub} selected={settings.language === l.id} onPress={() => l.ready && updateSettings({ language: l.id })} />
      ))}
      <Notice tone="neutral" icon="globe" text="L'appli est disponible en français. L'anglais, l'espagnol et le chinois arrivent prochainement (le site les propose déjà)." />
      <SectionTitle>Devise et format</SectionTitle>
      <Card>
        <SummaryRow label="Devise d'envoi" value={cur === "XAF" ? "Franc CFA (XAF)" : cur} />
        <SummaryRow label="Date" value="JJ/MM/AAAA" />
        <SummaryRow label="Nombres" value="1 234,56" />
        <SummaryRow label="Heure" value="14:05 (24 h)" />
      </Card>
    </Screen>
  );
}
