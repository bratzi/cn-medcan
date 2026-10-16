"use server";

import { benachrichtigen, nachrichtenFuer } from "@/lib/benachrichtigung";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { meldungText } from "@/lib/i18n/text";
import type { MeldungSchluessel } from "@/lib/i18n/typen";
import { beitragPruefen, juryslug, juryslugBasis } from "@/lib/jury";
import { darfBearbeiten, darfVerknuepfen } from "@/lib/jury-rechte";
import { getPrisma } from "@/lib/prisma";
import { juryErforderlich } from "@/lib/session";

export type Ergebnis = { ok: true; slug?: string; id?: string } | { ok: false; fehler: string };

async function fehlerText(schluessel: MeldungSchluessel): Promise<Ergebnis> {
  const w = await holeWoerterbuchAusAnfrage();
  return { ok: false, fehler: meldungText(w, { schluessel }) };
}

function eingabe(fd: FormData) {
  return {
    titel: String(fd.get("titel") ?? ""),
    anriss: String(fd.get("anriss") ?? ""),
    text: String(fd.get("text") ?? ""),
    reviewId: String(fd.get("reviewId") ?? "") || null,
  };
}

/** Neuer oder geänderter Entwurf; nur Jury, nur eigene Entwürfe (Spec 2026-10-16). */
export async function beitragSpeichern(fd: FormData): Promise<Ergebnis> {
  let m;
  try {
    m = await juryErforderlich();
  } catch {
    return fehlerText("jury.keineBerechtigung");
  }
  const e = eingabe(fd);
  const fehler = beitragPruefen(e);
  if (fehler.length) return fehlerText(`jury.${fehler[0]}` as MeldungSchluessel);
  const prisma = await getPrisma();
  if (e.reviewId) {
    const r = await prisma.review.findUnique({ where: { id: e.reviewId }, select: { autorId: true, freigegeben: true } });
    if (!darfVerknuepfen(r, m.mitgliedId)) return fehlerText("jury.bewertungFremd");
  }
  const id = String(fd.get("id") ?? "");
  if (id) {
    const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { autorId: true, status: true, slug: true } });
    if (!b || !darfBearbeiten(b, m)) return fehlerText("jury.keineBerechtigung");
    await prisma.juryBeitrag.update({ where: { id }, data: { titel: e.titel.trim(), anriss: e.anriss.trim(), text: e.text, reviewId: e.reviewId } });
    revalidiereSprachen("/profil");
    return { ok: true, slug: b.slug, id };
  }
  const belegt = new Set(
    (await prisma.juryBeitrag.findMany({ where: { slug: { startsWith: juryslugBasis(e.titel) } }, select: { slug: true }, take: 50 })).map((x) => x.slug),
  );
  const slug = juryslug(e.titel, (s) => belegt.has(s));
  const neu = await prisma.juryBeitrag.create({ select: { id: true }, data: { slug, titel: e.titel.trim(), anriss: e.anriss.trim(), text: e.text, reviewId: e.reviewId, autorId: m.mitgliedId } });
  revalidiereSprachen("/profil");
  return { ok: true, slug, id: neu.id };
}

/** Entwurf einreichen; Admins bekommen eine Benachrichtigung. */
export async function beitragEinreichen(fd: FormData): Promise<Ergebnis> {
  let m;
  try {
    m = await juryErforderlich();
  } catch {
    return fehlerText("jury.keineBerechtigung");
  }
  const prisma = await getPrisma();
  const id = String(fd.get("id") ?? "");
  const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { autorId: true, status: true, titel: true } });
  if (!b || !darfBearbeiten(b, m)) return fehlerText("jury.keineBerechtigung");
  await prisma.juryBeitrag.update({ where: { id }, data: { status: "EINGEREICHT" } });
  const admins = await prisma.mitglied.findMany({ where: { rolle: "ADMIN" }, select: { id: true }, take: 50 });
  // Art "KOMMENTAR" ohne Parameter zeigt den gespeicherten Satz; neue Arten braeuchten eine Trigger-Migration.
  await benachrichtigen(
    nachrichtenFuer(
      admins.map((a) => a.id),
      { art: "KOMMENTAR", text: `jury eingereicht: ${b.titel}`, parameter: null, link: "/admin/jury" },
    ),
  );
  revalidiereSprachen("/admin/jury");
  revalidiereSprachen("/profil");
  return { ok: true };
}
