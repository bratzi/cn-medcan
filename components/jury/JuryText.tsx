import type { Block, Inline } from "@/lib/jury-text";

/** Ein Textstück: fett und kursiv als Elemente, alles andere wörtlich (React maskiert HTML). */
function Teil({ teil }: { teil: Inline }) {
  let knoten = <>{teil.text}</>;
  if (teil.kursiv) knoten = <em>{knoten}</em>;
  if (teil.fett) knoten = <strong>{knoten}</strong>;
  return knoten;
}

function Zeile({ teile }: { teile: Inline[] }) {
  return (
    <>
      {teile.map((teil, index) => (
        <Teil key={index} teil={teil} />
      ))}
    </>
  );
}

/**
 * Rendert die geprüften Blöcke eines Jury-Textes (lib/jury-text): Zwischentitel als h2, Liste als
 * ul, Absatz als p, höchstens 68 Zeichen breit. Kein HTML aus dem Text, keine Links.
 */
export function JuryText({ bloecke }: { bloecke: Block[] }) {
  return (
    <div className="flex max-w-[68ch] flex-col gap-4 text-body text-text">
      {bloecke.map((block, index) => {
        if (block.art === "zwischentitel") {
          return (
            <h2 key={index} className="mt-4 font-buch text-h2 font-medium text-balance text-text">
              <Zeile teile={block.teile[0]} />
            </h2>
          );
        }
        if (block.art === "liste") {
          return (
            <ul key={index} className="flex list-disc flex-col gap-2 ps-6 marker:text-accent">
              {block.teile.map((zeile, nr) => (
                <li key={nr}>
                  <Zeile teile={zeile} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-pretty wrap-break-word">
            <Zeile teile={block.teile[0]} />
          </p>
        );
      })}
    </div>
  );
}
