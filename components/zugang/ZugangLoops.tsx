"use client";

import { useEffect } from "react";

import { beobachteLoops } from "@/components/story/bewegung/loops";

/**
 * Startet das Bühnenvideo auf /zugang, wo keine StoryBuehne läuft. Gleiche
 * Regeln wie dort: bei reduzierter Bewegung bleibt das Standbild, Datensparmodus
 * und Pausenknopf regelt beobachteLoops selbst.
 */
export function ZugangLoops() {
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    return beobachteLoops().stoppen;
  }, []);
  return null;
}
