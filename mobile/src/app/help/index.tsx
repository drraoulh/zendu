import { router } from "expo-router";
import { useState } from "react";
import { SectionTitle } from "@/components/form";
import { Button, Card, Empty, Field, Header, ListItem, Screen } from "@/components/ui";
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpCategory } from "@/lib/help";
import { tr } from "@/lib/i18n";

export default function Help() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<HelpCategory | null>(null);
  const query = q.trim().toLowerCase();
  const results = HELP_ARTICLES.filter(
    (a) => (!cat || a.category === cat) && (!query || `${a.title} ${a.intro} ${a.sections.map((s) => s.text).join(" ")}`.toLowerCase().includes(query)),
  );
  const open = (slug: string) => router.push({ pathname: "/help/[slug]", params: { slug } });

  return (
    <Screen footer={<Button title={tr("Nous contacter")} icon="mail" variant="secondary" onPress={() => router.push("/help/contact")} />}>
      {/* Dans une catégorie, « Retour » revient à la liste des catégories. */}
      <Header title={tr("Centre d'aide")} onBack={cat ? () => setCat(null) : undefined} />
      <Field label={tr("Rechercher")} placeholder={tr("Ex. frais, Interac, colis")} value={q} onChangeText={setQ} returnKeyType="search" autoCorrect={false} />
      {!query && !cat ? (
        <>
          <SectionTitle>{tr("Catégories")}</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {HELP_CATEGORIES.map((c) => (
              <ListItem key={c.id} icon={c.icon} title={tr(c.label)} onPress={() => setCat(c.id)} />
            ))}
          </Card>
          <SectionTitle>{tr("Questions fréquentes")}</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {HELP_ARTICLES.filter((a) => a.faq).map((a) => (
              <ListItem key={a.slug} icon="help" tone="neutral" title={tr(a.title)} onPress={() => open(a.slug)} />
            ))}
          </Card>
        </>
      ) : (
        <>
          <SectionTitle>{cat ? (HELP_CATEGORIES.find((c) => c.id === cat)?.label ?? tr("Résultats")) : tr("Résultats")}</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {results.length ? (
              results.map((a) => <ListItem key={a.slug} icon="help" tone="neutral" title={tr(a.title)} subtitle={tr(a.intro)} onPress={() => open(a.slug)} />)
            ) : (
              <Empty icon="help" title={tr("Aucun article")} text={tr("Essayez d'autres mots ou contactez-nous.")} />
            )}
          </Card>
          {cat ? <Button title={tr("Toutes les catégories")} variant="ghost" onPress={() => setCat(null)} style={{ marginTop: 8 }} /> : null}
        </>
      )}
    </Screen>
  );
}
