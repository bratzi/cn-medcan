import { ladeKatalog, ladeOeffentlichenKatalogText } from "@/lib/katalog/laden";
import { istFachkreis, koennteFachkreisSein } from "@/lib/query/fachkreis";

/**
 * Katalog der Blütenseite (Spec 2026-10-20). Öffentlich: vorgebauter Text aus KV, ohne
 * Sitzungsprüfung, wenn das Gate-Token keine Fachkreis-Rolle nennt. Fachkreis: dynamisch, privat.
 */
export async function GET(): Promise<Response> {
  const fachkreis = (await koennteFachkreisSein()) && (await istFachkreis());
  const text = fachkreis ? await ladeKatalog(true) : await ladeOeffentlichenKatalogText();
  return new Response(text, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": fachkreis ? "private, no-store" : "public, max-age=300, stale-while-revalidate=3600",
      vary: "cookie",
    },
  });
}
