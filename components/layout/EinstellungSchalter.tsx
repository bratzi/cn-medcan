"use client";

import { useSyncExternalStore } from "react";

import {
  abonniereEinstellungen,
  aktuellerZeiger,
  istSparmodus,
  naechsterZeiger,
  setzeSparmodus,
  setzeZeiger,
  type Zeiger,
} from "@/lib/einstellungen";

export type ZeigerTexte = { zeiger: string; zeigerStandard: string; zeigerJoint: string; zeigerBong: string };

const nieAufDemServer = () => false;

/**
 * Zeiger reihum: Standard, Joint, Bong (T13, Nutzer 2026-09-30). Nur mit feiner Maus
 * sichtbar (CSS), sonst gibt es keinen Zeiger. Der Name der Wahl steht im Label.
 */
export function ZeigerSchalter({ texte }: { texte: ZeigerTexte }) {
  const zeiger = useSyncExternalStore(abonniereEinstellungen, aktuellerZeiger, () => "standard" as Zeiger);
  const name = zeiger === "joint" ? texte.zeigerJoint : zeiger === "bong" ? texte.zeigerBong : texte.zeigerStandard;
  const label = `${texte.zeiger}: ${name}`;
  return (
    <button
      type="button"
      aria-pressed={zeiger !== "standard"}
      title={label}
      onClick={() => setzeZeiger(naechsterZeiger(aktuellerZeiger()))}
      className="schalter-knopf schalter-zeiger"
    >
      <span className="sr-only">{label}</span>
      {zeiger === "bong" ? (
        // Kleine Bong: Schale, Rohr, Wasserstand.
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M11 3 H17 V12 L20.5 19 Q21.5 22 18.5 22 H9.5 Q6.5 22 7.5 19 L11 12 Z" fill="none" strokeLinejoin="round" />
          <path d="M9.6 17 H18.4" />
          <path d="M11 13 L6.4 6.4" strokeLinecap="round" />
          <circle cx="5.4" cy="5.2" r="1.4" className="schalter-glut" />
        </svg>
      ) : (
        // Schräger Joint wie der Zeiger selbst.
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5.5 2.5 L21.5 19.5 L19.5 21.5 L2.5 5.5 Z" fill="none" strokeLinejoin="round" />
          <path d="M17.2 15.8 L19.5 21.5 M15.8 17.2 L21.5 19.5" />
          <circle cx="3.6" cy="3.6" r="1.4" className="schalter-glut" />
        </svg>
      )}
    </button>
  );
}

/** Pausiert Videos, Story-Bewegung, Endlosschleifen und den Joint- und Bong-Zeiger. */
export function SparSchalter({ label }: { label: string }) {
  const an = useSyncExternalStore(abonniereEinstellungen, istSparmodus, nieAufDemServer);
  return (
    <button
      type="button"
      aria-pressed={an}
      title={label}
      onClick={() => setzeSparmodus(!istSparmodus())}
      className="schalter-knopf"
    >
      <span className="sr-only">{label}</span>
      {/* Blatt mit Pause-Strichen: ruhen lassen. */}
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 21c-5-2.5-7.5-6.5-7-12.5C10 8.5 12 11 12 11s2-2.5 7-2.5c.5 6-2 10-7 12.5z" fill="none" strokeLinejoin="round" />
        <path d="M10.5 12.5v4M13.5 12.5v4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
