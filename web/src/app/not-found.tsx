import type { Metadata } from "next";
import { NotFoundContent } from "@/components/system/system-screen";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return <NotFoundContent />;
}
