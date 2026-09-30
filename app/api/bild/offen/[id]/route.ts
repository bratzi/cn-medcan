import { getPrisma } from "@/lib/prisma";
import { istBudpicId } from "@/lib/budpics";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Vorschau eines noch nicht freigegebenen Budpics (T9, Nutzer 2026-09-29),
 * nur fuer den Betreiber. Alle anderen bekommen 404, auch bei einer echten id:
 * wer kein Betreiber ist, soll nicht erfahren, dass es das Bild gibt. Nie
 * cachen, nie ueber die oeffentliche Route (/api/bild/<id>) ausliefern.
 */
export async function GET(_anfrage: Request, ctx: { params: Promise<{ id: string }> }) {
  const nichtDa = () => new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const { id } = await ctx.params;
  if (!istBudpicId(id)) return nichtDa();
  const mitglied = await aktuellesMitglied();
  if (!mitglied || mitglied.rolle !== "ADMIN") return nichtDa();

  const prisma = await getPrisma();
  const bild = await prisma.budpic.findUnique({ where: { id }, select: { daten: true } });
  if (!bild) return nichtDa();
  return new Response(bild.daten as BodyInit, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
