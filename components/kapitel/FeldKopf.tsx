import { Schlagwort } from "@/components/story/Schlagwort";

export type FeldKopfTexte = { vor: string; betont: string; nach?: string; schlagwort: string };

/**
 * Kopf eines Profilfelds wie die Sektionsköpfe der Startseite (Nutzer 2026-10-09: mehr Akzentschrift,
 * Güte der Startseite): Buchschrift mittig, ein Wort in Handschrift mit Farbverlauf, dahinter blass das
 * Schlagwort. Das Feld trägt dafür `relative isolate overflow-x-clip`.
 */
export function FeldKopf({ id, texte, ton = "gruen" }: { id: string; texte: FeldKopfTexte; ton?: "gruen" | "lila" }) {
  return (
    <>
      <Schlagwort satz={texte.schlagwort} ton={ton} oben="top-2" />
      <h2 id={id} className="font-buch text-h2 font-normal text-text text-center text-balance">
        {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        {texte.nach ? ` ${texte.nach}` : null}
      </h2>
    </>
  );
}
