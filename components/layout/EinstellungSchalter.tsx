"use client";

import { useSyncExternalStore } from "react";

import {
  abonniereEinstellungen,
  aktuellerZeiger,
  istSparmodus,
  naechsterZeiger,
  setzeSparmodus,
  setzeZeiger,
} from "@/lib/einstellungen";

const nieAufDemServer = () => false;

/** Joint-Zeiger an/aus. Nur mit feiner Maus sichtbar (CSS), sonst gibt es keinen Zeiger. */
export function ZeigerSchalter({ label }: { label: string }) {
  const joint = useSyncExternalStore(abonniereEinstellungen, () => aktuellerZeiger() === "joint", nieAufDemServer);
  return (
    <button
      type="button"
      aria-pressed={joint}
      title={label}
      onClick={() => setzeZeiger(naechsterZeiger(aktuellerZeiger()))}
      className="schalter-knopf schalter-zeiger"
    >
      <span className="sr-only">{label}</span>
      {/* Schräger Joint wie der Zeiger selbst; ausgegraut, wenn der normale Pfeil gilt. */}
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5.5 2.5 L21.5 19.5 L19.5 21.5 L2.5 5.5 Z" fill="none" strokeLinejoin="round" />
        <path d="M17.2 15.8 L19.5 21.5 M15.8 17.2 L21.5 19.5" />
        <circle cx="3.6" cy="3.6" r="1.4" className="schalter-glut" />
      </svg>
    </button>
  );
}

/** Pausiert Videos, Story-Bewegung, Endlosschleifen und den Joint-Zeiger. */
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
