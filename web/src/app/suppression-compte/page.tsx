import type { Metadata } from "next";
import { AccountDeletionContent } from "@/components/marketing/account-deletion";

export const metadata: Metadata = {
  title: "Supprimer votre compte",
  description: "Comment supprimer votre compte WorldSoft Transfer et vos données personnelles.",
};

export default function Page() {
  return <AccountDeletionContent />;
}
