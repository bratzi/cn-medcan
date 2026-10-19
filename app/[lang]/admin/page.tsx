import { AufgabenKacheln } from "@/components/admin/AufgabenKacheln";
import { PostKalender } from "@/components/admin/PostKalender";
import { ladeAdminZaehler } from "@/lib/query/admin-uebersicht";
import { ladeKalender } from "@/lib/query/publora-kalender";
import { adminSeite } from "@/lib/session";

export default async function AdminPage() {
  await adminSeite();
  const [zaehler, kalender] = await Promise.all([ladeAdminZaehler(), ladeKalender()]);
  return (
    <>
      <h1 className="text-h1 text-text">Verwaltung</h1>
      <AufgabenKacheln zaehler={zaehler} />
      <PostKalender kalender={kalender} />
    </>
  );
}
