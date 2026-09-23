import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { getAuth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { istMitgliedRolle, type MitgliedRolle } from "@/db/enums";

/**
 * Zugriffsschicht fuer die Anmeldung (Data Access Layer).
 *
 * Jede Server Action und jede Seite, die etwas ueber den angemeldeten Nutzer
 * wissen will, fragt hier - nie direkt bei Better Auth, und niemals im
 * Client. Der Client kennt nur, was eine Seite ihm gibt; ueber Rechte
 * entscheidet ausschliesslich der Server.
 *
 * `cache()` gilt pro Render-Durchlauf: mehrere Komponenten auf derselben
 * Seite loesen eine Abfrage aus, nicht fuenf.
 */

export type AngemeldetesMitglied = {
  userId: string;
  mitgliedId: string;
  email: string;
  anzeigename: string;
  instagramHandle: string | null;
  /// Manuell vom Betreiber freigegeben - erst damit besteht Stimmrecht.
  freigegeben: boolean;
  rolle: MitgliedRolle;
};

/** Rohe Better-Auth-Sitzung. Nur innerhalb dieser Datei gebraucht. */
const sitzung = cache(async () => {
  // headers() zuerst: damit ist die Seite dynamisch, bevor getAuth() das
  // Secret braucht. Andersherum rendert `next build` Seiten wie /admin vorab
  // und bricht ohne BETTER_AUTH_SECRET ab - Workers Builds hat keine Secrets.
  const anfrageHeader = await headers();
  const auth = await getAuth();
  return auth.api.getSession({ headers: anfrageHeader });
});

/**
 * Das angemeldete Mitglied, oder null.
 *
 * Fehlt der Mitgliedssatz (abgebrochener Hook, siehe lib/auth.ts), wird er
 * hier nachgelegt - ohne Freigabe.
 */
export const aktuellesMitglied = cache(async (): Promise<AngemeldetesMitglied | null> => {
  const sitz = await sitzung();
  if (!sitz) return null;

  const prisma = await getPrisma();
  const satz = await prisma.mitglied.upsert({
    where: { userId: sitz.user.id },
    create: { userId: sitz.user.id, anzeigename: sitz.user.name },
    update: {},
  });

  return {
    userId: sitz.user.id,
    mitgliedId: satz.id,
    email: sitz.user.email,
    anzeigename: satz.anzeigename,
    instagramHandle: satz.instagramHandle,
    freigegeben: satz.freigegeben,
    // Ein Wert, der an den Triggern vorbei in die Spalte kam, faellt hier auf
    // die niedrigste Rolle zurueck statt ungeprueft Rechte zu tragen.
    rolle: istMitgliedRolle(satz.rolle) ? satz.rolle : "MITGLIED",
  };
});

/** Angemeldet UND freigegeben - die Bedingung fuer Stimmrecht und Preise. */
export async function istFreigegeben(): Promise<boolean> {
  const mitglied = await aktuellesMitglied();
  return mitglied?.freigegeben === true;
}

export async function istAdmin(): Promise<boolean> {
  const mitglied = await aktuellesMitglied();
  return mitglied?.rolle === "ADMIN";
}

/**
 * Wirft, wenn nicht angemeldet. Fuer Server Actions, die ohne Nutzer keinen
 * Sinn ergeben - der Aufrufer muss den Fall nicht mehr behandeln.
 */
export async function mitgliedErforderlich(): Promise<AngemeldetesMitglied> {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) throw new Error("Nicht angemeldet.");
  return mitglied;
}

/** Wirft, wenn nicht freigegeben. Gate fuer Vorschlaege und Stimmen. */
export async function freigabeErforderlich(): Promise<AngemeldetesMitglied> {
  const mitglied = await mitgliedErforderlich();
  if (!mitglied.freigegeben) throw new Error("Freigabe steht noch aus.");
  return mitglied;
}

/** Wirft, wenn keine Admin-Rolle. Gate fuer /admin und dessen Aktionen. */
export async function adminErforderlich(): Promise<AngemeldetesMitglied> {
  const mitglied = await mitgliedErforderlich();
  if (mitglied.rolle !== "ADMIN") throw new Error("Keine Berechtigung.");
  return mitglied;
}
