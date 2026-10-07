"use server";

import { revalidiereSprachen } from "@/lib/i18n/revalidiere";

import { mitgliedErforderlich } from "@/lib/session";
import { gelesenIdsPruefen } from "@/lib/benachrichtigung";
import { getPrisma } from "@/lib/prisma";
import { profilEingabePruefen } from "@/lib/mitglied-eingabe";
import { AVATAR_MAX_BYTES, AVATAR_SEITE } from "@/lib/avatar";
import { bildPruefen } from "@/lib/bild-pruefen";
import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import { meldungText } from "@/lib/i18n/text";
import { sichtbarkeitsDaten } from "@/lib/profil-sichtbarkeit";
import { neueKurzId } from "@/lib/kurz-id";
import { istEindeutigkeitsfehler } from "@/lib/prisma-fehler";

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
  if (!geprueft.ok) return { ok: false, fehler: meldungText(await holeWoerterbuchAusAnfrage(), geprueft.fehler) };

  const prisma = await getPrisma();
  await prisma.mitglied.update({
    where: { id: mitglied.mitgliedId },
    data: geprueft.wert,
  });

  revalidiereSprachen("/mitglied");
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
  const w = await holeWoerterbuchAusAnfrage();

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

  revalidiereSprachen("/mitglied");
  return { ok: true };
}

/** Eigenes Profilbild loeschen; ohne Bild geschieht nichts. */
export async function avatarEntfernen(): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();
  const prisma = await getPrisma();
  await prisma.nutzerAvatar.deleteMany({ where: { mitgliedId: mitglied.mitgliedId } });
  revalidiereSprachen("/mitglied");
  return { ok: true };
}

/**
 * Öffentliches Profil ein- oder ausschalten (Spec Profil 9, Opt-in). Das
 * Mitglied kommt aus der Sitzung. Einschalten nur mit freigegebenem Konto
 * (Review W2: sonst ein unmoderierter Aushang mit Name und Bild); Ausschalten
 * geht immer. Trifft die neue Kurz-Id eine vergebene
 * (Unique-Index), wird höchstens dreimal neu gezogen; prüfen vor dem Schreiben
 * wäre eine Race Condition (lib/prisma-fehler.ts). Name im Buch und
 * Startseite ändern sich mit, deshalb auch / und /reviews; ohne Tag-Cache
 * trifft das nur den Router-Cache, die statischen Seiten folgen spätestens
 * nach ihrem revalidate (300 s). Die Adresse selbst gibt sofort 404. `an === true`
 * verhindert, dass ein beliebiger Wert aus dem Client als „an“ gilt.
 */
export async function profilSichtbarkeitSetzen(an: boolean): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();
  if (an === true && !mitglied.freigegeben) {
    return { ok: false, fehler: (await holeWoerterbuchAusAnfrage()).mitglied.sichtbarkeit.erstNachFreigabe };
  }
  const prisma = await getPrisma();
  for (let versuch = 0; versuch < 3; versuch++) {
    try {
      const daten = sichtbarkeitsDaten(an === true, mitglied.kurzId, neueKurzId);
      // Neue Kurz-Id nur, wenn noch keine steht: schalten zwei Tabs zugleich
      // ein, behält die zuerst geschriebene ihre Adresse.
      const { count } = daten.kurzId
        ? await prisma.mitglied.updateMany({ where: { id: mitglied.mitgliedId, kurzId: null }, data: daten })
        : { count: 0 };
      if (count === 0) {
        await prisma.mitglied.update({ where: { id: mitglied.mitgliedId }, data: { profilOeffentlich: daten.profilOeffentlich } });
      }
      for (const pfad of ["/mitglied", "/", "/reviews"]) revalidiereSprachen(pfad);
      return { ok: true };
    } catch (fehler) {
      if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    }
  }
  return { ok: false, fehler: (await holeWoerterbuchAusAnfrage()).mitglied.sichtbarkeit.fehler };
}
