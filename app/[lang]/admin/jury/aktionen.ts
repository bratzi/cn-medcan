"use server";

import { istIgStatus } from "@/db/enums";
import { benachrichtigen, nachrichtenFuer } from "@/lib/benachrichtigung";
import { bildPruefen } from "@/lib/bild-pruefen";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { beitragPruefen, JURY_BILD_MAX_BYTES, JURY_BILD_MAX_KANTE, JURY_BILDER_MAX, juryslug, juryslugBasis } from "@/lib/jury";
import { getPrisma } from "@/lib/prisma";
import { adminErforderlich } from "@/lib/session";

export type Ergebnis = { ok: true } | { ok: false; fehler: string };

// Admin-Seite ohne i18n: Meldungen fest deutsch, wie in den übrigen Admin-Aktionen.
const UNBEKANNT = "Diesen Beitrag gibt es nicht.";
const IG_URL = /^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?$/;

/** Nach jeder Änderung: Admin, Jury-Seiten, Startseite und die Blütenseite der verknüpften Sorte. */
async function neuLaden(beitragId: string, ausgabeSlugZusatz?: string | null) {
  const prisma = await getPrisma();
  const b = await prisma.juryBeitrag.findUnique({
    where: { id: beitragId },
    select: { slug: true, ausgabe: { select: { slug: true } }, review: { select: { kultivar: { select: { slug: true } } } } },
  });
  revalidiereSprachen("/admin/jury");
  revalidiereSprachen("/jury");
  revalidiereSprachen("/jury/favourites");
  revalidiereSprachen("/jury/team");
  revalidiereSprachen("/jury/seite/[nummer]", "page");
  revalidiereSprachen("/");
  if (b) revalidiereSprachen(`/jury/${b.slug}`);
  const ausgabeSlug = b?.ausgabe?.slug ?? ausgabeSlugZusatz;
  if (ausgabeSlug) revalidiereSprachen(`/jury/ausgabe/${ausgabeSlug}`);
  const kultivar = b?.review?.kultivar?.slug;
  if (kultivar) revalidiereSprachen(`/blueten/${kultivar}`);
}

function eingabe(fd: FormData) {
  return {
    titel: String(fd.get("titel") ?? ""),
    anriss: String(fd.get("anriss") ?? ""),
    text: String(fd.get("text") ?? ""),
    reviewId: String(fd.get("reviewId") ?? "") || null,
  };
}

const HWG_MELDUNG = "Der Text enthält Formulierungen, die nicht veröffentlicht werden dürfen (HWG).";
const FEHLER: Record<string, string> = {
  "titel.leer": "Titel fehlt.",
  "titel.lang": "Titel ist zu lang.",
  "anriss.lang": "Anriss ist zu lang.",
  "text.leer": "Text fehlt.",
  "text.lang": "Text ist zu lang.",
  hwg: HWG_MELDUNG,
};

/** Admin ändert jeden Beitrag, in jedem Status; Status bleibt. */
export async function adminBeitragSpeichern(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const e = eingabe(fd);
  const fehler = beitragPruefen(e);
  if (fehler.length) return { ok: false, fehler: FEHLER[fehler[0]] ?? HWG_MELDUNG };
  const prisma = await getPrisma();
  if (!(await prisma.juryBeitrag.findUnique({ where: { id }, select: { id: true } }))) return { ok: false, fehler: UNBEKANNT };
  if (e.reviewId && !(await prisma.review.findUnique({ where: { id: e.reviewId }, select: { id: true } }))) return { ok: false, fehler: "Diese Bewertung gibt es nicht." };
  await prisma.juryBeitrag.update({ where: { id }, data: { titel: e.titel.trim(), anriss: e.anriss.trim(), text: e.text, reviewId: e.reviewId } });
  await neuLaden(id);
  return { ok: true };
}

export async function beitragVeroeffentlichen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const prisma = await getPrisma();
  const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { titel: true, anriss: true, text: true, reviewId: true } });
  if (!b) return { ok: false, fehler: UNBEKANNT };
  if (beitragPruefen(b).length) return { ok: false, fehler: HWG_MELDUNG };
  const ausgabeId = String(fd.get("ausgabeId") ?? "") || null;
  if (ausgabeId && !(await prisma.juryAusgabe.findUnique({ where: { id: ausgabeId }, select: { id: true } }))) return { ok: false, fehler: "Diese Ausgabe gibt es nicht." };
  const position = Math.trunc(Number(fd.get("position") ?? 0)) || 0;
  await prisma.juryBeitrag.update({ where: { id }, data: { status: "VEROEFFENTLICHT", veroeffentlichtAm: new Date(), ausgabeId, position } });
  await neuLaden(id);
  return { ok: true };
}

/** Zurück an die Autorin oder den Autor: Notiz, Status ENTWURF, Benachrichtigung. */
export async function beitragZurueckgeben(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const notiz = String(fd.get("notiz") ?? "").trim().slice(0, 1000) || null;
  const prisma = await getPrisma();
  const b = await prisma.juryBeitrag.findUnique({ where: { id }, select: { autorId: true, titel: true } });
  if (!b) return { ok: false, fehler: UNBEKANNT };
  await prisma.juryBeitrag.update({ where: { id }, data: { status: "ENTWURF", notiz } });
  // Art "KOMMENTAR" ohne Parameter zeigt den gespeicherten Satz; neue Arten braeuchten eine Trigger-Migration.
  await benachrichtigen(
    nachrichtenFuer([b.autorId], {
      art: "KOMMENTAR",
      text: `Dein Jury-Beitrag „${b.titel}“ ist zurück im Entwurf${notiz ? `: ${notiz}` : "."}`,
      parameter: null,
      link: "/profil",
    }),
  );
  await neuLaden(id);
  revalidiereSprachen("/profil");
  return { ok: true };
}

export async function beitragZurueckziehen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const prisma = await getPrisma();
  if (!(await prisma.juryBeitrag.findUnique({ where: { id }, select: { id: true } }))) return { ok: false, fehler: UNBEKANNT };
  await prisma.juryBeitrag.update({ where: { id }, data: { status: "ZURUECKGEZOGEN" } });
  await neuLaden(id);
  return { ok: true };
}

export async function juryBildHochladen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const beitragId = String(fd.get("beitragId") ?? "");
  const datei = fd.get("bild");
  if (!(datei instanceof File) || datei.size === 0) return { ok: false, fehler: "Es wurde kein Bild gesendet." };
  if (datei.size > JURY_BILD_MAX_BYTES) return { ok: false, fehler: `Das Bild ist größer als ${JURY_BILD_MAX_BYTES / 1024} KB.` };
  const bytes = new Uint8Array(await datei.arrayBuffer());
  const g = bildPruefen(bytes, { maxBytes: JURY_BILD_MAX_BYTES, maxBreite: JURY_BILD_MAX_KANTE, maxHoehe: JURY_BILD_MAX_KANTE });
  if (!g.ok) return { ok: false, fehler: "Das ist kein gültiges Bild (JPEG, PNG oder WebP, Kante höchstens 1600 Pixel)." };
  const prisma = await getPrisma();
  if (!(await prisma.juryBeitrag.findUnique({ where: { id: beitragId }, select: { id: true } }))) return { ok: false, fehler: UNBEKANNT };
  const anzahl = await prisma.juryBild.count({ where: { beitragId } });
  if (anzahl >= JURY_BILDER_MAX) return { ok: false, fehler: `Mehr als ${JURY_BILDER_MAX} Bilder sind nicht möglich.` };
  await prisma.juryBild.create({
    data: { beitragId, position: anzahl, daten: bytes, breite: g.breite, hoehe: g.hoehe, symbolbild: fd.get("symbolbild") === "1", alt: String(fd.get("alt") ?? "").slice(0, 200) },
  });
  await neuLaden(beitragId);
  return { ok: true };
}

export async function juryBildLoeschen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const prisma = await getPrisma();
  const bild = await prisma.juryBild.findUnique({ where: { id }, select: { beitragId: true } });
  if (!bild) return { ok: false, fehler: "Das Bild gibt es nicht mehr." };
  await prisma.juryBild.delete({ where: { id } });
  await neuLaden(bild.beitragId);
  return { ok: true };
}

/** position ±1: tauscht mit dem Nachbarn in der Reihenfolge. */
export async function juryBildVerschieben(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const richtung = Number(fd.get("richtung") ?? 0) < 0 ? -1 : 1;
  const prisma = await getPrisma();
  const bild = await prisma.juryBild.findUnique({ where: { id }, select: { beitragId: true } });
  if (!bild) return { ok: false, fehler: "Das Bild gibt es nicht mehr." };
  const alle = await prisma.juryBild.findMany({
    where: { beitragId: bild.beitragId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
    take: JURY_BILDER_MAX + 1,
  });
  const i = alle.findIndex((x) => x.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= alle.length) return { ok: true };
  // Positionen neu fortlaufend vergeben, so bleibt die Reihenfolge auch bei doppelten Werten eindeutig.
  const reihenfolge = alle.map((x) => x.id);
  [reihenfolge[i], reihenfolge[j]] = [reihenfolge[j], reihenfolge[i]];
  await prisma.$transaction(reihenfolge.map((bildId, position) => prisma.juryBild.update({ where: { id: bildId }, data: { position } })));
  await neuLaden(bild.beitragId);
  return { ok: true };
}

export async function juryBildSymbol(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const prisma = await getPrisma();
  const bild = await prisma.juryBild.findUnique({ where: { id }, select: { beitragId: true } });
  if (!bild) return { ok: false, fehler: "Das Bild gibt es nicht mehr." };
  await prisma.juryBild.update({ where: { id }, data: { symbolbild: fd.get("symbolbild") === "1" } });
  await neuLaden(bild.beitragId);
  return { ok: true };
}

function ausgabeNeuLaden(slug: string) {
  revalidiereSprachen("/admin/jury");
  revalidiereSprachen("/jury");
  revalidiereSprachen("/jury/seite/[nummer]", "page");
  revalidiereSprachen(`/jury/ausgabe/${slug}`);
  revalidiereSprachen("/");
}

/** Neue oder geänderte Ausgabe (Slug nur beim Anlegen). */
export async function ausgabeSpeichern(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const titel = String(fd.get("titel") ?? "").trim();
  if (!titel || titel.length > 90) return { ok: false, fehler: "Titel fehlt oder ist zu lang (höchstens 90 Zeichen)." };
  const einleitung = String(fd.get("einleitung") ?? "").trim().slice(0, 1000);
  const roh = String(fd.get("erscheintAm") ?? "");
  const erscheintAm = roh ? new Date(roh) : null;
  if (erscheintAm && Number.isNaN(erscheintAm.getTime())) return { ok: false, fehler: "Das Datum ist ungültig." };
  const prisma = await getPrisma();
  if (id) {
    const a = await prisma.juryAusgabe.findUnique({ where: { id }, select: { slug: true } });
    if (!a) return { ok: false, fehler: "Diese Ausgabe gibt es nicht." };
    await prisma.juryAusgabe.update({ where: { id }, data: { titel, einleitung, erscheintAm } });
    ausgabeNeuLaden(a.slug);
    return { ok: true };
  }
  const belegt = new Set(
    (await prisma.juryAusgabe.findMany({ where: { slug: { startsWith: juryslugBasis(titel) } }, select: { slug: true }, take: 50 })).map((x) => x.slug),
  );
  const slug = juryslug(titel, (s) => belegt.has(s));
  await prisma.juryAusgabe.create({ data: { slug, titel, einleitung, erscheintAm } });
  ausgabeNeuLaden(slug);
  return { ok: true };
}

export async function ausgabeVeroeffentlichen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const prisma = await getPrisma();
  const a = await prisma.juryAusgabe.findUnique({ where: { id }, select: { slug: true, erscheintAm: true } });
  if (!a) return { ok: false, fehler: "Diese Ausgabe gibt es nicht." };
  await prisma.juryAusgabe.update({ where: { id }, data: { status: "VEROEFFENTLICHT", erscheintAm: a.erscheintAm ?? new Date() } });
  ausgabeNeuLaden(a.slug);
  return { ok: true };
}

/** Instagram-Zustand eines Beitrags; Link nur als öffentliche Beitrags- oder Reel-Adresse. */
export async function igStatusSetzen(fd: FormData): Promise<Ergebnis> {
  await adminErforderlich();
  const id = String(fd.get("id") ?? "");
  const igUrl = String(fd.get("igUrl") ?? "").trim() || null;
  const igStatus = String(fd.get("igStatus") ?? "");
  if (!istIgStatus(igStatus)) return { ok: false, fehler: "Unbekannter Instagram-Status." };
  if (igUrl && !IG_URL.test(igUrl)) return { ok: false, fehler: "Bitte eine öffentliche Instagram-Adresse (Beitrag oder Reel) angeben." };
  const prisma = await getPrisma();
  if (!(await prisma.juryBeitrag.findUnique({ where: { id }, select: { id: true } }))) return { ok: false, fehler: UNBEKANNT };
  await prisma.juryBeitrag.update({ where: { id }, data: { igUrl, igStatus } });
  await neuLaden(id);
  return { ok: true };
}
