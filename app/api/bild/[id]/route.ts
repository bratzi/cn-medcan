import { getPrisma } from "@/lib/prisma";

/**
 * Bild-Route (T8, Ruling R4, Nutzer 2026-09-29): liefert ein Bild aus D1.
 * Heute nur Avatare (NutzerAvatar); T9 (Budpics) ergaenzt seine Tabelle in
 * `bildLaden`, die Route bleibt.
 *
 * Die id ist eine Zufalls-UUID und wechselt bei jedem neuen Upload. Deshalb
 * darf die Antwort ein Jahr unveraenderlich gecacht werden (Cloudflare und
 * Browser); ein ersetztes Bild hat schlicht eine andere URL. Eine geloeschte
 * id liefert 404, das sich nicht lange festsetzt.
 *
 * Kein Sitzungszugriff: die Route ist oeffentlich und deshalb cachebar. Der
 * Inhalt wurde beim Speichern per Magic Bytes geprueft (lib/bild-pruefen.ts);
 * `nosniff` und der feste Typ verhindern trotzdem jede Umdeutung.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Bild-Bytes zur id, oder null. Neue Bildarten hier ergaenzen. */
async function bildLaden(id: string): Promise<{ bytes: Uint8Array; typ: string } | null> {
  const prisma = await getPrisma();
  const avatar = await prisma.nutzerAvatar.findUnique({ where: { id }, select: { bild: true } });
  if (avatar) return { bytes: avatar.bild, typ: "image/webp" };
  return null;
}

export async function GET(_anfrage: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bild = UUID.test(id) ? await bildLaden(id) : null;
  if (!bild) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  }
  return new Response(bild.bytes as BodyInit, {
    headers: {
      "Content-Type": bild.typ,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
