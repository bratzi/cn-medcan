"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { benachrichtigen, nachrichtenFuer, textKommentar, textKommentarGemeldet } from "@/lib/benachrichtigung";
import { kommentarPruefen, meldegrundPruefen } from "@/lib/kommentar-eingabe";
import { darfLoeschen, darfSchreiben, nachMeldung, zuSchnell } from "@/lib/kommentar-rechte";
import { kommentarZaehlerZiele, istDoppelt, zaehlerUpsert } from "@/lib/reaktionen";
import { KOMMENTAR_ZIELE, type KommentarStatus, type KommentarZiel } from "@/db/enums";
import { getPrisma } from "@/lib/prisma";
import { adminErforderlich, aktuellesMitglied } from "@/lib/session";
import { inhaberVon, KOMMENTAR_KOPF, KOMMENTAR_SELECT, REVIEW_ZIEL, zuAnsicht, type KommentarAnsicht, type KommentarZeile } from "@/lib/query/kommentare";

/**
 * Kommentare schreiben, löschen, melden, entscheiden (Spec 2026-10-14).
 *
 * Wer handelt, kommt immer aus der Sitzung, nie aus dem Aufruf. Zähler werden
 * im selben $transaction-Batch gepflegt wie der Kommentar (CPU-Limit: nie beim Lesen zählen).
 * Statuswechsel laufen als bedingte updateMany, damit ein Doppelklick nicht doppelt zählt.
 */

type Fehler = "anmelden" | "freigabe" | "leer" | "lang" | "hwg" | "schnell" | "weg";

const EINE_STUNDE = 60 * 60 * 1000;
const DREISSIG_TAGE = 30 * 24 * 60 * 60 * 1000;

function istZiel(ziel: unknown): ziel is KommentarZiel {
  return typeof ziel === "string" && (KOMMENTAR_ZIELE as readonly string[]).includes(ziel);
}

/** Zähler-Ziele eines Kommentars; für Bewertungen gehört die Blüte (Kultivar) dazu. */
async function zaehlerZiele(ziel: KommentarZiel, zielId: string) {
  if (ziel === "PROFIL") return kommentarZaehlerZiele(ziel, zielId, null);
  const prisma = await getPrisma();
  const review = await prisma.review.findUnique({ where: { id: zielId }, select: { strain: { select: { kultivarId: true } } } });
  return kommentarZaehlerZiele(ziel, zielId, review?.strain?.kultivarId ?? null);
}

async function zaehlerAendern(ziel: KommentarZiel, zielId: string, delta: 1 | -1): Promise<void> {
  const prisma = await getPrisma();
  const ziele = await zaehlerZiele(ziel, zielId);
  const batch = () => ziele.map((z) => zaehlerUpsert(prisma, z.art, z.id, "kommentare", delta));
  try {
    await prisma.$transaction(batch());
  } catch (e) {
    // Zwei erste Upserts gleichzeitig: der zweite trifft die Zeile des ersten, ein Wiederholen zählt dann.
    if (!istDoppelt(e)) throw e;
    await prisma.$transaction(batch());
  }
}

export async function schreibeKommentar(
  ziel: KommentarZiel,
  zielId: string,
  text: string,
): Promise<{ ok: true; kommentar: KommentarAnsicht } | { ok: false; fehler: Fehler }> {
  const ich = await aktuellesMitglied();
  if (!ich) return { ok: false, fehler: "anmelden" };
  if (!ich.freigegeben) return { ok: false, fehler: "freigabe" };
  if (!istZiel(ziel) || typeof zielId !== "string" || !zielId) return { ok: false, fehler: "weg" };

  const geprueft = kommentarPruefen(text);
  if (!geprueft.ok) return { ok: false, fehler: geprueft.fehler };

  const prisma = await getPrisma();
  let zielOeffentlich = false;
  let inhaberId = "";
  let kultivarId: string | null = null;
  if (ziel === "BEWERTUNG") {
    const review = await prisma.review.findUnique({
      where: { id: zielId },
      select: REVIEW_ZIEL,
    });
    if (!review) return { ok: false, fehler: "weg" };
    zielOeffentlich = review.freigegeben;
    inhaberId = review.autorId ?? "";
    kultivarId = review.strain?.kultivarId ?? null;
  } else {
    const m = await prisma.mitglied.findUnique({ where: { id: zielId }, select: { id: true, profilOeffentlich: true, freigegeben: true } });
    if (!m) return { ok: false, fehler: "weg" };
    // Wie das öffentliche Profil selbst: nur freigegebene Mitglieder mit eingeschaltetem Profil.
    zielOeffentlich = m.profilOeffentlich && m.freigegeben;
    inhaberId = m.id;
  }
  if (!darfSchreiben({ ziel, zielOeffentlich })) return { ok: false, fehler: "weg" };

  const vor1h = new Date(Date.now() - EINE_STUNDE);
  if (zuSchnell(await prisma.kommentar.count({ where: { autorId: ich.mitgliedId, erstelltAm: { gte: vor1h } } }))) {
    return { ok: false, fehler: "schnell" };
  }

  const zaehler = kommentarZaehlerZiele(ziel, zielId, kultivarId);
  const batch = () =>
    [
      prisma.kommentar.create({ data: { autorId: ich.mitgliedId, zielArt: ziel, zielId, text: geprueft.text }, select: KOMMENTAR_SELECT }),
      ...zaehler.map((z) => zaehlerUpsert(prisma, z.art, z.id, "kommentare", 1)),
    ];
  let ergebnis;
  try {
    ergebnis = await prisma.$transaction(batch());
  } catch (e) {
    if (!istDoppelt(e)) throw e;
    ergebnis = await prisma.$transaction(batch());
  }
  const angelegt = ergebnis[0] as KommentarZeile;
  const autorId = angelegt.autorId;

  if (inhaberId && inhaberId !== ich.mitgliedId) {
    await benachrichtigen(
      nachrichtenFuer([inhaberId], { art: "KOMMENTAR", text: textKommentar(ich.anzeigename), parameter: null, link: null }),
    );
  }
  revalidiereSprachen("/reviews", "layout");
  return {
    ok: true,
    kommentar: zuAnsicht(
      angelegt,
      darfLoeschen({ ichId: ich.mitgliedId, istAdmin: ich.rolle === "ADMIN", autorId, inhaberId }),
    ),
  };
}

export async function loescheKommentar(id: string): Promise<{ ok: boolean }> {
  const ich = await aktuellesMitglied();
  if (!ich || typeof id !== "string" || !id) return { ok: false };
  const prisma = await getPrisma();
  const k = await prisma.kommentar.findUnique({ where: { id }, select: KOMMENTAR_KOPF });
  if (!k || k.status === "GELOESCHT" || !istZiel(k.zielArt)) return { ok: false };
  const autorId = k.autorId;
  const inhaberId = await inhaberVon(k.zielArt, k.zielId);
  if (!darfLoeschen({ ichId: ich.mitgliedId, istAdmin: ich.rolle === "ADMIN", autorId, inhaberId })) return { ok: false };

  // Bedingt auf den gelesenen Status: nur wer den Wechsel wirklich vollzieht, zählt ab.
  const r = await prisma.kommentar.updateMany({ where: { id, status: k.status }, data: { status: "GELOESCHT" } });
  if (r.count === 1 && k.status === "SICHTBAR") await zaehlerAendern(k.zielArt, k.zielId, -1);
  revalidiereSprachen("/reviews", "layout");
  return { ok: true };
}

export async function meldeKommentar(id: string, grund?: string): Promise<{ ok: boolean }> {
  const ich = await aktuellesMitglied();
  if (!ich || !ich.freigegeben || typeof id !== "string" || !id) return { ok: false };
  const prisma = await getPrisma();
  const k = await prisma.kommentar.findUnique({ where: { id }, select: KOMMENTAR_KOPF });
  if (!k || k.status === "GELOESCHT" || !istZiel(k.zielArt) || k.autorId === ich.mitgliedId) return { ok: false };

  try {
    await prisma.kommentarMeldung.create({ data: { kommentarId: id, mitgliedId: ich.mitgliedId, grund: meldegrundPruefen(grund) } });
  } catch (e) {
    if (istDoppelt(e)) return { ok: true };
    throw e;
  }
  const anzahl = await prisma.kommentarMeldung.count({ where: { kommentarId: id } });
  if (k.status === "SICHTBAR" && nachMeldung(anzahl, k.status as KommentarStatus) === "GEMELDET") {
    const r = await prisma.kommentar.updateMany({ where: { id, status: "SICHTBAR" }, data: { status: "GEMELDET" } });
    if (r.count === 1) {
      await zaehlerAendern(k.zielArt, k.zielId, -1);
      const admins = await prisma.mitglied.findMany({ where: { rolle: "ADMIN" }, select: { id: true } });
      await benachrichtigen(
        nachrichtenFuer(
          admins.map((a) => a.id),
          { art: "KOMMENTAR_GEMELDET", text: textKommentarGemeldet(), parameter: null, link: "/admin" },
        ),
      );
      revalidiereSprachen("/reviews", "layout");
    }
  }
  return { ok: true };
}

export async function adminEntscheide(id: string, wahl: "freigeben" | "loeschen"): Promise<{ ok: boolean }> {
  try {
    await adminErforderlich();
  } catch {
    return { ok: false };
  }
  if (typeof id !== "string" || !id || (wahl !== "freigeben" && wahl !== "loeschen")) return { ok: false };
  const prisma = await getPrisma();
  const k = await prisma.kommentar.findUnique({ where: { id }, select: { zielArt: true, zielId: true, status: true } });
  if (!k || !istZiel(k.zielArt)) return { ok: false };

  if (wahl === "freigeben") {
    if (k.status !== "GEMELDET") return { ok: false };
    const r = await prisma.kommentar.updateMany({ where: { id, status: "GEMELDET" }, data: { status: "SICHTBAR" } });
    if (r.count !== 1) return { ok: false };
    await prisma.kommentarMeldung.deleteMany({ where: { kommentarId: id } });
    await zaehlerAendern(k.zielArt, k.zielId, 1);
  } else {
    if (k.status === "GELOESCHT") return { ok: true };
    const r = await prisma.kommentar.updateMany({ where: { id, status: k.status }, data: { status: "GELOESCHT" } });
    if (r.count === 1 && k.status === "SICHTBAR") await zaehlerAendern(k.zielArt, k.zielId, -1);
  }
  revalidiereSprachen("/reviews", "layout");
  return { ok: true };
}

export async function gemeldeteKommentare(): Promise<Array<KommentarAnsicht & { meldungen: number; gruende: string[] }>> {
  try {
    await adminErforderlich();
  } catch {
    return [];
  }
  const prisma = await getPrisma();
  // Gelöschte Texte nach 30 Tagen endgültig abräumen (Meldungen gehen per Cascade mit).
  await prisma.kommentar.deleteMany({ where: { status: "GELOESCHT", erstelltAm: { lt: new Date(Date.now() - DREISSIG_TAGE) } } });
  const zeilen = await prisma.kommentar.findMany({
    where: { status: "GEMELDET" },
    orderBy: { erstelltAm: "asc" },
    take: 100,
    select: { ...KOMMENTAR_SELECT, meldungen: { select: { grund: true } } },
  });
  return zeilen.map((z) => ({
    ...zuAnsicht(z, true),
    meldungen: z.meldungen.length,
    gruende: z.meldungen.map((m) => m.grund).filter((g): g is string => !!g),
  }));
}
