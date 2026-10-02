import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { normalizeReference } from "@/lib/requests";
import { getRequest } from "../../../_server/data";
import { DbError } from "../../../_ui/kit";
import { RequestDetail } from "../../../_ui/request-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ reference: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).reference).toUpperCase() };
}

export default async function AdminRequestPage({ params }: Props) {
  const reference = normalizeReference(decodeURIComponent((await params).reference));
  if (!reference) notFound();
  let request;
  try {
    request = await getRequest(reference);
  } catch (err) {
    console.error("[admin] demande indisponible", err);
    return <DbError />;
  }
  if (!request) notFound();
  return <RequestDetail request={request} />;
}
