import { Fragment } from "react";

import type { Block, Inline } from "@/lib/jury-text";

function Teile({ teile }: { teile: Inline[] }) {
  return (
    <>
      {teile.map((t, i) => {
        if (t.fett) return <strong key={i} className="font-semibold">{t.text}</strong>;
        if (t.kursiv) return <em key={i}>{t.text}</em>;
        return <Fragment key={i}>{t.text}</Fragment>;
      })}
    </>
  );
}

/** Rendert die Blöcke aus juryTextBloecke(): nur Absatz, Zwischentitel und Liste, nie HTML aus dem Text. */
export function TextBloecke({ bloecke }: { bloecke: Block[] }) {
  return (
    <div className="flex max-w-[68ch] flex-col gap-4 text-body text-text">
      {bloecke.map((b, i) => {
        if (b.art === "zwischentitel") {
          return (
            <h3 key={i} className="mt-4 font-buch text-h3 text-text text-balance">
              <Teile teile={b.teile[0]} />
            </h3>
          );
        }
        if (b.art === "liste") {
          return (
            <ul key={i} className="flex list-disc flex-col gap-2 pl-6">
              {b.teile.map((z, j) => (
                <li key={j}>
                  <Teile teile={z} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-pretty">
            <Teile teile={b.teile[0]} />
          </p>
        );
      })}
    </div>
  );
}
