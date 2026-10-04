import type { Metadata } from "next";
import { CustomerNew } from "../../../_ui/customer-new";

export const metadata: Metadata = { title: "Nouveau client" };

export default function AdminNewCustomerPage() {
  return <CustomerNew />;
}
