import { KennwerteBereich } from "@/components/admin/bereiche/Kennwerte";
import { adminSeite } from "@/lib/session";

export default async function AdminKennwertePage() {
  await adminSeite("/admin/kennwerte");
  return <KennwerteBereich />;
}
