/**
 * Buzz-Satz hinter einer Sektion (Spec Redesign 7, Referenz choreograffiti):
 * kurz, in Handschrift, riesig von Rand zu Rand und blass im Hintergrund.
 * Trägt keine Information, deshalb aria-hidden. Die Sektion braucht
 * `relative isolate overflow-x-clip` (clip statt hidden: sticky bleibt
 * intakt), damit der Satz hinter dem Inhalt bleibt und seitlich anschneidet.
 */
const TON = { gruen: "text-accent", lila: "text-kopierstift" } as const;

export function Schlagwort({
  satz,
  ton = "lila",
  oben = "top-4",
}: {
  satz: string;
  /** Grün und Lila wechseln sich von Sektion zu Sektion ab (Spec Redesign 12). */
  ton?: keyof typeof TON;
  oben?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 -z-10 select-none whitespace-nowrap text-center font-hand text-kulisse opacity-15 ${TON[ton]} ${oben}`}
    >
      {satz}
    </span>
  );
}
