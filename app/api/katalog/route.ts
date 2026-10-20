import { ladeKatalog } from "@/lib/katalog/laden";
import { istFachkreis } from "@/lib/query/fachkreis";

/** Katalog der Blütenseite (Spec 2026-10-20). Öffentlich im Browser cachebar, Fachkreis privat. */
export async function GET(): Promise<Response> {
  const fachkreis = await istFachkreis();
  const text = await ladeKatalog(fachkreis);
  return new Response(text, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": fachkreis ? "private, no-store" : "public, max-age=300, stale-while-revalidate=3600",
      vary: "cookie",
    },
  });
}
