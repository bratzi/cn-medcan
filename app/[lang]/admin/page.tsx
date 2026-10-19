import { adminSeite } from "@/lib/session";

export default async function AdminPage() {
  await adminSeite();
  return <h1 className="text-h1 text-text">Verwaltung</h1>;
}
