import { router } from "expo-router";
import { useState } from "react";
import { SectionTitle } from "@/components/form";
import { Button, Card, Empty, Field, Header, ListItem, Screen } from "@/components/ui";
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpCategory } from "@/lib/help";

export default function Help() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<HelpCategory | null>(null);
  const query = q.trim().toLowerCase();
  const results = HELP_ARTICLES.filter(
    (a) => (!cat || a.category === cat) && (!query || `${a.title} ${a.intro} ${a.sections.map((s) => s.text).join(" ")}`.toLowerCase().includes(query)),
  );
  const open = (slug: string) => router.push({ pathname: "/help/[slug]", params: { slug } });

  return (
    <Screen footer={<Button title="Nous contacter" icon="mail" variant="secondary" onPress={() => router.push("/help/contact")} />}>
      <Header title="Centre d'aide" />
      <Field label="Rechercher" placeholder="Rechercher dans l'aide" value={q} onChangeText={setQ} />
      {!query && !cat ? (
        <>
          <SectionTitle>Catégories</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {HELP_CATEGORIES.map((c) => (
              <ListItem key={c.id} icon={c.icon} title={c.label} onPress={() => setCat(c.id)} />
            ))}
          </Card>
          <SectionTitle>Questions fréquentes</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {HELP_ARTICLES.filter((a) => a.faq).map((a) => (
              <ListItem key={a.slug} icon="help" tone="neutral" title={a.title} onPress={() => open(a.slug)} />
            ))}
          </Card>
        </>
      ) : (
        <>
          <SectionTitle>{cat ? (HELP_CATEGORIES.find((c) => c.id === cat)?.label ?? "Résultats") : "Résultats"}</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {results.length ? (
              results.map((a) => <ListItem key={a.slug} icon="help" tone="neutral" title={a.title} subtitle={a.intro} onPress={() => open(a.slug)} />)
            ) : (
              <Empty icon="help" title="Aucun article" text="Essayez d'autres mots ou contactez-nous." />
            )}
          </Card>
          {cat ? <Button title="Toutes les catégories" variant="ghost" onPress={() => setCat(null)} style={{ marginTop: 8 }} /> : null}
        </>
      )}
    </Screen>
  );
}
