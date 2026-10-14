import { igKarteHtml } from "@/lib/ig-karte";
import { igReviewEinzeln } from "@/lib/query/ig-feed";

/** Instagram-Karte als HTML für den Screenshot in Cowork (Spec 2026-10-14). Zugang nur mit ?key= (Proxy). */
export async function GET(anfrage: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ursprung = new URL(anfrage.url).origin;
  const review = await igReviewEinzeln(id, ursprung);
  if (!review) return new Response("Nicht gefunden", { status: 404 });
  return new Response(igKarteHtml(review, ursprung), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=900", "X-Robots-Tag": "noindex" },
  });
}
