import { Bild } from "@/components/medien/Bild";
import { blueteBild } from "@/lib/medien";

const PROZENT_TERPEN = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 2 });

/**
 * Kopf der Aroma-Erkundung (Nutzer 2026-09-25): ganz oben, damit man weiß, was
 * bewertet wird. Symbolbild groß, daneben die Herstellerangaben zu den Terpenen
 * zum Vergleich mit der Karte darunter.
 */
export function SortenKopf({
  handelsname,
  bildPfad,
  terpene,
}: {
  handelsname: string;
  bildPfad: string | null;
  terpene: readonly { name: string; konzentrationProzent: number | null; rang: number; aromaProfil?: string | null }[];
}) {
  const bildId = blueteBild(bildPfad);
  return (
    <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[auto_1fr] md:gap-16">
      {bildId ? (
        <figure className="flex w-full max-w-80 flex-col items-start gap-2 md:w-80">
          <Bild id={bildId} dekorativ sizes="(min-width: 768px) 320px, 100vw" className="aspect-square w-full object-contain" />
          <figcaption className="text-caption text-text-muted">Symbolbild</figcaption>
        </figure>
      ) : null}
      <div className="flex flex-col gap-4">
        <h3 className="font-buch text-h2 font-medium text-text">{handelsname}</h3>
        {terpene.length > 0 ? (
          <>
            <p className="text-small uppercase tracking-wide text-text-muted">Laut Hersteller</p>
            <ul className="flex flex-col gap-2">
              {terpene.map((terpen) => (
                <li key={terpen.name} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-border pb-2">
                  <span className="font-medium text-text">{terpen.name}</span>
                  <span className="numeric text-small text-text">
                    {terpen.konzentrationProzent !== null
                      ? PROZENT_TERPEN.format(terpen.konzentrationProzent / 100)
                      : `Rang ${terpen.rang}`}
                  </span>
                  {terpen.aromaProfil ? <span className="text-small text-text-muted">{terpen.aromaProfil}</span> : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
