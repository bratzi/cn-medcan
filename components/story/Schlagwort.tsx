/**
 * Buzz-Satz hinter einer Sektion (Spec Redesign 7, Referenz choreograffiti):
 * kurz, in Handschrift, riesig von Rand zu Rand und blass im Hintergrund.
 * Trägt keine Information, deshalb aria-hidden. Die Sektion braucht
 * `relative isolate overflow-x-clip` (clip statt hidden: sticky bleibt
 * intakt), damit der Satz hinter dem Inhalt bleibt und seitlich anschneidet.
 */
export function Schlagwort({ satz, oben = "top-4" }: { satz: string; oben?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 -z-10 select-none whitespace-nowrap text-center font-hand text-kulisse text-border ${oben}`}
    >
      {satz}
    </span>
  );
}
