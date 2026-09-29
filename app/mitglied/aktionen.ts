"use server";

import { revalidatePath } from "next/cache";

import { mitgliedErforderlich } from "@/lib/session";
import { gelesenIdsPruefen } from "@/lib/benachrichtigung";
import { getPrisma } from "@/lib/prisma";
import { profilEingabePruefen } from "@/lib/mitglied-eingabe";
import { AVATAR_MAX_BYTES, AVATAR_SEITE } from "@/lib/avatar";
import { bildPruefen } from "@/lib/bild-pruefen";
import { holeWoerterbuch } from "@/lib/i18n";
import { meldungText } from "@/lib/i18n/text";

export type ProfilErgebnis = { ok: true } | { ok: false; fehler: string };

/**
 * Anzeigename und Instagram-Handle des angemeldeten Mitglieds.
 *
 * Bewusst NICHT aenderbar: `freigegeben` und `rolle`. Beides vergibt der
 * Betreiber in /admin; waeren sie hier schreibbar, koennte sich jeder selbst
 * Stimmrecht geben. Die Aktion liest deshalb nur die zwei Felder aus dem
 * Formular und ignoriert alles andere darin.
 *
 * Die Zuordnung kommt aus lib/session.ts, nicht aus dem Formular - eine
 * mitgesendete Mitglieds-Id waere eine fremde Identitaet.
 */
export async function profilSpeichern(formData: FormData): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();

  const geprueft = profilEingabePruefen(
    String(formData.get("anzeigename") ?? ""),
    String(formData.get("instagramHandle") ?? ""),
  );
  if (!geprueft.ok) return { ok: false, fehler: meldungText(await holeWoerterbuch(), geprueft.fehler) };

  const prisma = await getPrisma();
  await prisma.mitglied.update({
    where: { id: mitglied.mitgliedId },
    data: geprueft.wert,
  });

  revalidatePath("/mitglied");
  return { ok: true };
}

/**
 * Die angezeigten Benachrichtigungen als gelesen markieren. Nur diese: aeltere
 * jenseits der Liste bleiben ungelesen, sonst verschwaende ihr "Neu", ohne dass
 * sie je zu sehen waren. Hoechstens 20 Ids, also weit unter der D1-Grenze.
 */
export async function benachrichtigungenGelesen(roh: unknown): Promise<void> {
  const mitglied = await mitgliedErforderlich();
  const ids = gelesenIdsPruefen(roh);
  if (ids.length === 0) return;
  const prisma = await getPrisma();
  await prisma.benachrichtigung.updateMany({
    where: { id: { in: ids }, mitgliedId: mitglied.mitgliedId, gelesenAm: null },
    data: { gelesenAm: new Date() },
  });
}

/**
 * Profilbild des angemeldeten Mitglieds setzen (T8, Nutzer 2026-09-29).
 *
 * Der Browser hat das Bild schon auf 128 x 128 WebP verkleinert
 * (lib/bild-verkleinern.ts); darauf verlassen wir uns nicht. Der Server prueft
 * Groesse (vor dem Lesen) und danach Typ per Magic Bytes und Masse. Das
 * Mitglied kommt aus der Sitzung, nie aus dem Formular. Jeder Upload legt eine
 * NEUE id an (altes Bild loeschen, neues anlegen), damit die unveraenderlich
 * gecachte URL nie ein altes Bild zeigt. Prisma faehrt das Array als D1-Batch.
 */
export async function avatarSpeichern(formData: FormData): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();
  const w = await holeWoerterbuch();

  const datei = formData.get("bild");
  if (!(datei instanceof File) || datei.size === 0) {
    return { ok: false, fehler: meldungText(w, { schluessel: "bild.fehlt" }) };
  }
  // Vor dem Einlesen ablehnen: ein grosser Body soll keinen Speicher kosten.
  if (datei.size > AVATAR_MAX_BYTES) {
    return { ok: false, fehler: meldungText(w, { schluessel: "bild.zuGross", parameter: { max: AVATAR_MAX_BYTES / 1024 } }) };
  }
  const bytes = new Uint8Array(await datei.arrayBuffer());
  const geprueft = bildPruefen(bytes, { maxBytes: AVATAR_MAX_BYTES, breite: AVATAR_SEITE, hoehe: AVATAR_SEITE });
  if (!geprueft.ok) return { ok: false, fehler: meldungText(w, geprueft.fehler) };

  const prisma = await getPrisma();
  await prisma.$transaction([
    prisma.nutzerAvatar.deleteMany({ where: { mitgliedId: mitglied.mitgliedId } }),
    prisma.nutzerAvatar.create({ data: { mitgliedId: mitglied.mitgliedId, bild: bytes } }),
  ]);

  revalidatePath("/mitglied");
  return { ok: true };
}

/** Eigenes Profilbild loeschen; ohne Bild geschieht nichts. */
export async function avatarEntfernen(): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();
  const prisma = await getPrisma();
  await prisma.nutzerAvatar.deleteMany({ where: { mitgliedId: mitglied.mitgliedId } });
  revalidatePath("/mitglied");
  return { ok: true };
}
