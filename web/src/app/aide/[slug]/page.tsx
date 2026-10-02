import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpArticleView } from "@/components/info/help-content";
import { getHelpNumbers } from "@/components/info/destinations";
import { HELP_ARTICLES, getHelpArticle } from "@/components/info/help-articles";

export const revalidate = 3600;
export const dynamicParams = false;

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return { title: "Article introuvable" };
  const plain = article.fr.a.replace(/\{[a-z]+\}/g, "").replace(/\n+/g, " ").replace(/^- /gm, "");
  return {
    title: article.fr.q,
    description: plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}…` : plain,
    alternates: { canonical: `/aide/${article.slug}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();
  const numbers = await getHelpNumbers();
  return <HelpArticleView slug={article.slug} numbers={numbers} />;
}
