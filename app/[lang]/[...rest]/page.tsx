import { notFound } from "next/navigation";

/**
 * Jeder Pfad ohne eigene Seite (Spec 2026-10-01, statische Seiten, 4.1): Der
 * Proxy schreibt alle Seitenpfade auf /de/… oder /en/… um; was keine Route hat,
 * landet hier und zeigt app/[lang]/not-found.tsx in der Sprache der Anfrage.
 * Dynamisch, legt also keinen Cache-Eintrag an.
 */
export default function UnbekanntePage(): never {
  notFound();
}
