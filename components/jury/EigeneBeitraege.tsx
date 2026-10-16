import Link from "next/link";

import { BeitragEditor, type EditorBeitrag } from "@/components/jury/BeitragEditor";
import { Badge, buttonKlassen, textLinkKlassen } from "@/components/ui";
import type { BadgeVariante } from "@/components/ui";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Zeile = EditorBeitrag & { status: string };

type Props = {
  beitraege: readonly Zeile[];
  bewertungen: readonly { id: string; label: string }[];
  /** `neu`, eine Beitrags-Id oder null (nur die Liste). Kommt aus ?jury= in /profil. */
  offen: string | null;
  texte: Woerterbuch["profil"]["jury"];
};

const VARIANTE: Record<string, BadgeVariante> = {
  ENTWURF: "neutral",
  EINGEREICHT: "warning",
  VEROEFFENTLICHT: "success",
  ZURUECKGEZOGEN: "danger",
};

/** Liste der eigenen Beiträge; ein Entwurf (oder „neu“) öffnet den Editor darunter. */
export function EigeneBeitraege({ beitraege, bewertungen, offen, texte }: Props) {
  const bearbeitet = offen && offen !== "neu" ? beitraege.find((b) => b.id === offen && b.status === "ENTWURF") : undefined;
  const zeigeEditor = offen === "neu" || !!bearbeitet;
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.satz}</p>
      {zeigeEditor ? (
        // key: beim Wechsel des Beitrags beginnt der Editor mit dessen Werten.
        <BeitragEditor key={bearbeitet?.id ?? "neu"} beitrag={bearbeitet ?? null} bewertungen={bewertungen} texte={texte} />
      ) : (
        <div>
          <Link prefetch={false} scroll={false} href="/profil?jury=neu" className={buttonKlassen("primary")}>
            {texte.neu}
          </Link>
        </div>
      )}
      {beitraege.length === 0 ? (
        <p className="text-body text-text-muted">{texte.leer}</p>
      ) : (
        <ul aria-label={texte.listeLeiste} className="flex w-full flex-col divide-y divide-border border-y border-border">
          {beitraege.map((b) => {
            const zurueck = b.status === "ENTWURF" && !!b.notiz;
            return (
              <li key={b.id} className="flex flex-col gap-2 py-4">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-buch text-h3 text-text wrap-break-word">{b.titel}</span>
                  <Badge variante={zurueck ? "warning" : (VARIANTE[b.status] ?? "neutral")}>
                    {zurueck ? texte.zurueckgegeben : (texte.status as Record<string, string>)[b.status] ?? b.status}
                  </Badge>
                </span>
                {zurueck ? <span className="text-small text-text-muted">{t(texte.notiz, { text: b.notiz ?? "" })}</span> : null}
                <span className="flex flex-wrap gap-4 text-small">
                  {b.status === "ENTWURF" ? (
                    <Link prefetch={false} scroll={false} href={`/profil?jury=${b.id}`} className={textLinkKlassen()}>
                      {texte.bearbeiten}
                    </Link>
                  ) : null}
                  {b.status === "VEROEFFENTLICHT" ? (
                    <Link prefetch={false} href={`/jury/${b.slug}`} className={textLinkKlassen()}>
                      {texte.ansehen}
                    </Link>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
