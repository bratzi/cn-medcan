export type FeldKopfTexte = { vor: string; betont: string; nach?: string; schlagwort: string };

const TON = { gruen: "text-accent", lila: "text-kopierstift" } as const;

/**
 * Kopf eines Profilfelds wie die Sektionsköpfe der Startseite (Nutzer 2026-10-09: mehr Akzentschrift,
 * Güte der Startseite): Buchschrift mittig, ein Wort in Handschrift mit Farbverlauf, darüber das
 * Schlagwort gesperrt in Versalien wie „Terpen für Terpen“ im Hero (Nutzer 2026-10-13). Kein Riesenwort
 * im Hintergrund: in einem Feld überdeckte es die Überschrift und schnitt in halben Feldern ab.
 */
export function FeldKopf({ id, texte, ton = "gruen" }: { id: string; texte: FeldKopfTexte; ton?: keyof typeof TON }) {
  return (
    <>
      <p aria-hidden="true" className={`font-sans text-caption uppercase tracking-gesperrt ${TON[ton]}`}>
        {texte.schlagwort}
      </p>
      <h2 id={id} className="font-buch text-display font-normal text-text text-center text-balance">
        {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        {texte.nach ? ` ${texte.nach}` : null}
      </h2>
    </>
  );
}
