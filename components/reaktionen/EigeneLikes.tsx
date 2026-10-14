"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { ZielArt } from "@/db/enums";
import { ladeEigeneLikes } from "@/app/[lang]/reaktionen/aktionen";

/** D1 nimmt je Abfrage nur rund 100 Bind-Werte (lib/haeppchen.ts); der Client schneidet vorher. */
const HAEPPCHEN = 90;

type Wert = { registriere: (art: ZielArt, id: string) => void; gelikt: (art: ZielArt, id: string) => boolean };

const Kontext = createContext<Wert | null>(null);

/**
 * Sammelt, welche Herzen einer Seite mich selbst betreffen: alle Herzen melden sich im selben Tick an,
 * der Anbieter fragt danach einmal je Art (in Häppchen) nach, statt dass jedes Herz eine Server Action
 * auslöst. Ohne Sitzung antwortet die Action sofort mit einer leeren Liste. Seiten bleiben statisch.
 */
export function EigeneLikes({ children }: { children: ReactNode }) {
  const [an, setAn] = useState<ReadonlySet<string>>(() => new Set());
  const wartend = useRef(new Map<ZielArt, Set<string>>());
  const bekannt = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spuele = useCallback(async () => {
    timer.current = null;
    const paket = [...wartend.current];
    wartend.current = new Map();
    const treffer: string[] = [];
    await Promise.all(
      paket.flatMap(([art, ids]) => {
        const liste = [...ids];
        const teile: string[][] = [];
        for (let i = 0; i < liste.length; i += HAEPPCHEN) teile.push(liste.slice(i, i + HAEPPCHEN));
        return teile.map((teil) =>
          ladeEigeneLikes(art, teil)
            .then((gefunden) => {
              for (const id of gefunden) treffer.push(`${art}:${id}`);
            })
            .catch(() => {}),
        );
      }),
    );
    if (treffer.length > 0) setAn((alt) => new Set([...alt, ...treffer]));
  }, []);

  const registriere = useCallback(
    (art: ZielArt, id: string) => {
      const schluessel = `${art}:${id}`;
      if (bekannt.current.has(schluessel)) return;
      bekannt.current.add(schluessel);
      const menge = wartend.current.get(art) ?? new Set<string>();
      menge.add(id);
      wartend.current.set(art, menge);
      if (timer.current === null) timer.current = setTimeout(() => void spuele(), 0);
    },
    [spuele],
  );

  const wert = useMemo<Wert>(() => ({ registriere, gelikt: (art, id) => an.has(`${art}:${id}`) }), [registriere, an]);
  return <Kontext value={wert}>{children}</Kontext>;
}

/** Für LikeKnopf: meldet das Herz an und liefert, ob ich es schon gemocht habe (false, bis die Antwort da ist). */
export function useEigeneLikes(art: ZielArt, zielId: string): boolean {
  const k = useContext(Kontext);
  useEffect(() => {
    k?.registriere(art, zielId);
  }, [k, art, zielId]);
  return k ? k.gelikt(art, zielId) : false;
}
