import { PostKalender } from "@/components/admin/PostKalender";
import { ladeKalender } from "@/lib/query/publora-kalender";
import { adminSeite } from "@/lib/session";

export default async function AdminInstagramPage() {
  await adminSeite("/admin/instagram");
  return <PostKalender kalender={await ladeKalender()} />;
}
