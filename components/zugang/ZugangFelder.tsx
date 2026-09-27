"use client";

import { useSyncExternalStore } from "react";

import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Formularfelder von /zugang. Liest `weiter` und `fehler` im Browser aus der
 * Adresse, damit die Seite selbst ohne searchParams statisch bleibt (Plan
 * Caching v2, Schritt 7). Ohne JS gilt weiter = "/". Ob `weiter` ein sicheres
 * Ziel ist, prueft weiterhin /api/zugang (lib/weiterleitung.ts).
 */
const nieAendern = () => () => {};
const suche = () => window.location.search;
const sucheAufDemServer = () => "";

export function ZugangFelder({ texte }: { texte: Woerterbuch["zugang"] }) {
  const parameter = new URLSearchParams(useSyncExternalStore(nieAendern, suche, sucheAufDemServer));
  const weiter = parameter.get("weiter") ?? "/";
  const fehler = parameter.has("fehler");

  return (
    <>
      <input type="hidden" name="weiter" value={weiter} />

      <div className="flex flex-col gap-2">
        <label htmlFor="passwort" className="text-small font-medium text-text">
          {texte.passwort}
        </label>
        <input
          id="passwort"
          name="passwort"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          aria-describedby={fehler ? "zugang-fehler" : undefined}
          aria-invalid={fehler ? true : undefined}
          className="h-11 rounded-md border border-border-strong bg-surface px-4 text-body text-text outline-none transition-colors duration-150 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
        />
      </div>

      {fehler ? (
        <p id="zugang-fehler" role="alert" className="text-small text-danger">
          {texte.falsch}
        </p>
      ) : null}
    </>
  );
}
