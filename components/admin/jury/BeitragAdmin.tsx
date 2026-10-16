"use client";

import Link from "next/link";
import { useId } from "react";

import { beitragVeroeffentlichen, beitragZurueckgeben, beitragZurueckziehen, igStatusSetzen } from "@/app/[lang]/admin/jury/aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { BildVerwaltung, type AdminBild } from "@/components/admin/jury/BildVerwaltung";
import { TextBloecke } from "@/components/jury/TextBloecke";
import { Badge, Button, Field, Input, Meldung, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { IG_STATUS } from "@/db/enums";
import { juryTextBloecke } from "@/lib/jury-text";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Texte = Woerterbuch["admin"]["jury"];

export type AdminBeitrag = {
  id: string;
  slug: string;
  titel: string;
  anriss: string;
  text: string;
  autor: string;
  /** Fertiger Text („Gelato über Alpha“) oder null bei einem Artikel. */
  bewertung: string | null;
  ausgabeId: string | null;
  position: number;
  igUrl: string | null;
  igStatus: string;
  bilder: AdminBild[];
};

type Props = {
  beitrag: AdminBeitrag;
  modus: "eingereicht" | "veroeffentlicht";
  ausgaben: readonly { id: string; titel: string }[];
  texte: Texte;
};

const FELD =
  "w-full rounded-md border border-border-strong bg-surface px-4 py-2 text-body text-text " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

function Rueckmeldung({ fehler }: { fehler: string | null }) {
  return (
    <div aria-live="polite" className="min-h-6">
      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}

/** Eingereichter Beitrag: prüfen, Bilder, Ausgabe wählen, veröffentlichen oder mit Notiz zurückgeben. */
function Pruefung({ beitrag, ausgaben, texte }: Omit<Props, "modus">) {
  const basis = useId();
  const frei = useAktion();
  const zurueck = useAktion();
  const optionen: SelectOption[] = [{ wert: "", label: texte.ohneAusgabe }, ...ausgaben.map((a) => ({ wert: a.id, label: a.titel }))];
  const bloecke = juryTextBloecke(beitrag.text);

  return (
    <div className="flex flex-col gap-8">
      {beitrag.anriss ? (
        <p className="max-w-[68ch] text-body text-text text-pretty">
          <span className="font-medium">{texte.anriss}: </span>
          {beitrag.anriss}
        </p>
      ) : null}
      <details>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-small font-medium text-text underline underline-offset-4">
          {texte.textAnzeigen}
        </summary>
        <div className="border border-border bg-surface-raised p-6">
          <TextBloecke bloecke={bloecke} />
        </div>
      </details>

      <BildVerwaltung beitragId={beitrag.id} bilder={beitrag.bilder} texte={texte} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const daten = new FormData(e.currentTarget);
          daten.set("id", beitrag.id);
          frei.ausfuehren(() => beitragVeroeffentlichen(daten));
        }}
        className="flex max-w-[68ch] flex-col gap-4"
      >
        <Select
          id={`${basis}-ausgabe`}
          name="ausgabeId"
          label={texte.ausgabe}
          optionen={optionen}
          defaultValue={beitrag.ausgabeId ?? ""}
        />
        <Input
          id={`${basis}-position`}
          name="position"
          type="number"
          inputMode="numeric"
          label={texte.position}
          defaultValue={beitrag.position}
          feldClassName="max-w-48"
        />
        <div>
          <Button type="submit" disabled={!frei.bereit || !zurueck.bereit}>
            {frei.laeuft ? texte.laeuft : texte.veroeffentlichen}
          </Button>
        </div>
        <Rueckmeldung fehler={frei.fehler} />
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const daten = new FormData(e.currentTarget);
          daten.set("id", beitrag.id);
          zurueck.ausfuehren(() => beitragZurueckgeben(daten));
        }}
        className="flex max-w-[68ch] flex-col gap-4"
      >
        <Field id={`${basis}-notiz`} label={texte.notiz} hinweis={texte.notizHinweis}>
          {(attribute) => <textarea {...attribute} name="notiz" rows={3} maxLength={1000} className={FELD} />}
        </Field>
        <div>
          <Button type="submit" variante="secondary" disabled={!frei.bereit || !zurueck.bereit}>
            {zurueck.laeuft ? texte.laeuft : texte.zurueckgeben}
          </Button>
        </div>
        <Rueckmeldung fehler={zurueck.fehler} />
      </form>
    </div>
  );
}

/** Veröffentlichter Beitrag: Instagram-Angaben pflegen oder den Beitrag zurückziehen. */
function Veroeffentlicht({ beitrag, texte }: Omit<Props, "modus" | "ausgaben">) {
  const basis = useId();
  const ig = useAktion();
  const ziehen = useAktion();
  const status: SelectOption[] = IG_STATUS.map((s) => ({ wert: s, label: (texte.igStatusNamen as Record<string, string>)[s] ?? s }));

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const daten = new FormData(e.currentTarget);
          daten.set("id", beitrag.id);
          ig.ausfuehren(() => igStatusSetzen(daten));
        }}
        className="flex max-w-[68ch] flex-col gap-4"
      >
        <Input
          id={`${basis}-iglink`}
          name="igUrl"
          type="url"
          inputMode="url"
          label={texte.igLink}
          hinweis={texte.igLinkHinweis}
          defaultValue={beitrag.igUrl ?? ""}
        />
        <Select id={`${basis}-igstatus`} name="igStatus" label={texte.igStatus} optionen={status} defaultValue={beitrag.igStatus} />
        <div>
          <Button type="submit" variante="secondary" disabled={!ig.bereit || !ziehen.bereit}>
            {ig.laeuft ? texte.laeuft : texte.igSpeichern}
          </Button>
        </div>
        <Rueckmeldung fehler={ig.fehler} />
      </form>
      <div className="flex flex-col gap-2">
        <div>
          <Button
            type="button"
            variante="ghost"
            disabled={!ig.bereit || !ziehen.bereit}
            onClick={() => {
              const daten = new FormData();
              daten.set("id", beitrag.id);
              ziehen.ausfuehren(() => beitragZurueckziehen(daten));
            }}
          >
            {ziehen.laeuft ? texte.laeuft : texte.zurueckziehen}
          </Button>
        </div>
        <Rueckmeldung fehler={ziehen.fehler} />
      </div>
    </div>
  );
}

/** Eine Beitragskarte in /admin/jury; Kopf mit Titel, Autor und Bewertung, darunter je nach Reiter die Handgriffe. */
export function BeitragAdmin({ beitrag, modus, ausgaben, texte }: Props) {
  const veroeffentlicht = modus === "veroeffentlicht";
  return (
    <article className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header className="flex flex-col gap-2">
        <h3 className="font-buch text-h3 text-text wrap-break-word">
          {veroeffentlicht ? (
            <Link prefetch={false} href={`/jury/${beitrag.slug}`} className="underline underline-offset-4">
              {beitrag.titel}
            </Link>
          ) : (
            beitrag.titel
          )}
        </h3>
        <p className="flex flex-wrap items-center gap-2 text-small text-text-muted">
          <span>{t(texte.von, { autor: beitrag.autor })}</span>
          <span>{beitrag.bewertung ? t(texte.bewertung, { text: beitrag.bewertung }) : texte.ohneBewertung}</span>
          {veroeffentlicht ? (
            <Badge variante={beitrag.igStatus === "VEROEFFENTLICHT" ? "success" : beitrag.igStatus === "FEHLER" ? "danger" : "neutral"}>
              {`IG: ${(texte.igStatusNamen as Record<string, string>)[beitrag.igStatus] ?? beitrag.igStatus}`}
            </Badge>
          ) : null}
        </p>
      </header>
      {veroeffentlicht ? <Veroeffentlicht beitrag={beitrag} texte={texte} /> : <Pruefung beitrag={beitrag} ausgaben={ausgaben} texte={texte} />}
    </article>
  );
}
