import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminLeiste } from "@/components/admin/AdminLeiste";
import { ladeAdminZaehler } from "@/lib/query/admin-uebersicht";
import { aktuellesMitglied } from "@/lib/session";

export const metadata: Metadata = { title: "Verwaltung", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fadmin");
  if (mitglied.rolle !== "ADMIN") notFound();
  const zaehler = await ladeAdminZaehler();
  return (
    <div className="mx-auto w-full max-w-320 px-4 py-16 sm:px-8">
      <AdminLeiste zaehler={zaehler} />
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}
