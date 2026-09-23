"use client";

import { useSyncExternalStore } from "react";

/** Kein Abonnement noetig: der Wert wechselt nur einmal, mit der Hydration. */
const nieAbonnieren = () => () => {};
const imBrowser = () => true;
const beimServerRender = () => false;

/**
 * `false` waehrend des Server-Renders und der ersten Darstellung, `true`
 * sobald React hydriert hat.
 *
 * Gebraucht wird das, weil an einem Formular bis zur Hydration kein
 * React-Handler haengt: ein Absenden davor geht als nativer GET raus,
 * schreibt die Eingaben in die URL und bewirkt nichts. Auf einer frisch
 * geladenen Seite ist das reproduzierbar. Wer ein Formular baut, sperrt den
 * Absende-Button damit, bis der eigene Handler tatsaechlich da ist.
 *
 * `useSyncExternalStore` statt `useState` plus `useEffect`: das ist der Weg,
 * den React fuer genau diesen Unterschied zwischen Server und Browser
 * vorsieht - und er kommt ohne `setState` in einem Effekt aus.
 */
export function useHydriert(): boolean {
  return useSyncExternalStore(nieAbonnieren, imBrowser, beimServerRender);
}
