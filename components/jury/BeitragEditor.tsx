"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import { beitragEinreichen, beitragSpeichern } from "@/app/[lang]/jury/aktionen";
import { TextBloecke } from "@/components/jury/TextBloecke";
import { Button, buttonKlassen, Field } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import { ANRISS_MAX, TEXT_MAX, TITEL_MAX } from "@/lib/jury";
import { juryTextBloecke } from "@/lib/jury-text";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type EditorBeitrag = {
  id: string;
  slug: string;
  titel: string;
  anriss: string;
  text: string;
  reviewId: string | null;
  /** Notiz der Redaktion nach „zurückgegeben“. */
  notiz: string | null;
};

type Props = {
  beitrag: EditorBeitrag | null;
  bewertungen: readonly { id: string; label: string }[];
  texte: Woerterbuch["profil"]["jury"];
};

type Antwort = { art: "fehler" | "erfolg"; text: string } | null;

/** Felder 48 px hoch (h-12), Fokusring aus dem Token. */
const FELD =
  "w-full rounded-md border border-border-strong bg-surface px-4 text-body text-text " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-invalid:border-danger";

const REITER = ["schreiben", "vorschau"] as const;
type Reiter = (typeof REITER)[number];

/**
 * Editor für einen Jury-Beitrag im Profil. Speichern legt einen Entwurf an oder ändert ihn;
 * Einreichen speichert zuerst und gibt dann zur Prüfung frei. Geprüft wird auf dem Server
 * (lib/jury.ts), maxLength und Zähler sind Bedienkomfort.
 */
export function BeitragEditor({ beitrag, bewertungen, texte }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const basis = useId();
  const formular = useRef<HTMLFormElement>(null);
  const [id, setId] = useState(beitrag?.id ?? null);
  const [titel, setTitel] = useState(beitrag?.titel ?? "");
  const [anriss, setAnriss] = useState(beitrag?.anriss ?? "");
  const [text, setText] = useState(beitrag?.text ?? "");
  const [reiter, setReiter] = useState<Reiter>("schreiben");
  const [laeuft, setLaeuft] = useState(false);
  const [antwort, setAntwort] = useState<Antwort>(null);

  const bloecke = juryTextBloecke(text);
  const zaehler = (anzahl: number, max: number) => t(texte.zaehler, { anzahl, max });

  /** Speichert; bei einem neuen Beitrag merkt sich der Editor die Id und die Adresse zeigt ihn. */
  async function speichern(): Promise<string | null> {
    if (!formular.current) return null;
    const daten = new FormData(formular.current);
    if (id) daten.set("id", id);
    const ergebnis = await beitragSpeichern(daten);
    if (!ergebnis.ok) {
      setAntwort({ art: "fehler", text: ergebnis.fehler });
      return null;
    }
    const neueId = ergebnis.id ?? id;
    if (neueId && neueId !== id) {
      setId(neueId);
      router.replace(`/profil?jury=${neueId}`, { scroll: false });
    }
    router.refresh();
    return neueId ?? null;
  }

  async function ausfuehren(einreichen: boolean) {
    setLaeuft(true);
    setAntwort(null);
    try {
      const gespeichert = await speichern();
      if (!gespeichert) return;
      if (!einreichen) {
        setAntwort({ art: "erfolg", text: texte.gespeichert });
        return;
      }
      const daten = new FormData();
      daten.set("id", gespeichert);
      const ergebnis = await beitragEinreichen(daten);
      if (!ergebnis.ok) {
        setAntwort({ art: "fehler", text: ergebnis.fehler });
        return;
      }
      router.replace("/profil", { scroll: false });
      router.refresh();
    } catch {
      setAntwort({ art: "fehler", text: texte.fehlerAllgemein });
    } finally {
      setLaeuft(false);
    }
  }

  function reiterTaste(ereignis: React.KeyboardEvent<HTMLButtonElement>) {
    if (ereignis.key !== "ArrowRight" && ereignis.key !== "ArrowLeft") return;
    ereignis.preventDefault();
    const neu = reiter === "schreiben" ? "vorschau" : "schreiben";
    setReiter(neu);
    document.getElementById(`${basis}-reiter-${neu}`)?.focus();
  }

  return (
    <form
      ref={formular}
      onSubmit={(e) => {
        e.preventDefault();
        void ausfuehren(false);
      }}
      className="flex flex-col gap-6"
    >
      {beitrag?.notiz ? (
        <p className="max-w-[68ch] border border-border-strong bg-surface-raised p-4 text-body text-text">
          <span className="font-medium">{texte.zurueckgegeben}.</span> {t(texte.notiz, { text: beitrag.notiz })}
        </p>
      ) : null}

      <Field id={`${basis}-titel`} label={texte.titel} pflicht={texte.pflicht} hinweis={zaehler(titel.length, TITEL_MAX)}>
        {(attribute) => (
          <input
            {...attribute}
            name="titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            maxLength={TITEL_MAX}
            required
            className={`h-12 ${FELD}`}
          />
        )}
      </Field>

      <Field id={`${basis}-anriss`} label={texte.anriss} hinweis={`${texte.anrissHinweis} ${zaehler(anriss.length, ANRISS_MAX)}`}>
        {(attribute) => (
          <textarea
            {...attribute}
            name="anriss"
            value={anriss}
            onChange={(e) => setAnriss(e.target.value)}
            maxLength={ANRISS_MAX}
            rows={3}
            className={`py-2 ${FELD}`}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p id={`${basis}-text-etikett`} className="text-small font-medium text-text">
            {texte.text}
            <span className="text-text-muted">{` (${texte.pflicht})`}</span>
          </p>
          <div role="tablist" aria-label={texte.reiterLeiste} className="flex gap-2">
            {REITER.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                id={`${basis}-reiter-${r}`}
                aria-selected={reiter === r}
                aria-controls={`${basis}-tafel-${r}`}
                tabIndex={reiter === r ? 0 : -1}
                onClick={() => setReiter(r)}
                onKeyDown={reiterTaste}
                className={`min-h-11 border-b-2 px-4 text-small font-medium transition-colors duration-fast ${
                  reiter === r ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {texte[r]}
              </button>
            ))}
          </div>
        </div>

        <div role="tabpanel" id={`${basis}-tafel-schreiben`} aria-labelledby={`${basis}-reiter-schreiben`} hidden={reiter !== "schreiben"}>
          <Field id={`${basis}-text`} label={texte.text} labelVersteckt hinweis={`${texte.textHilfe} ${zaehler(text.length, TEXT_MAX)}`}>
            {(attribute) => (
              <textarea
                {...attribute}
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={TEXT_MAX}
                rows={14}
                required
                className={`py-2 ${FELD}`}
              />
            )}
          </Field>
        </div>
        <div
          role="tabpanel"
          id={`${basis}-tafel-vorschau`}
          aria-labelledby={`${basis}-reiter-vorschau`}
          hidden={reiter !== "vorschau"}
          className="min-h-48 border border-border bg-surface-raised p-6"
        >
          {bloecke.length > 0 ? <TextBloecke bloecke={bloecke} /> : <p className="text-body text-text-muted">{texte.vorschauLeer}</p>}
        </div>
      </div>

      <Field id={`${basis}-bewertung`} label={texte.bewertung} hinweis={texte.bewertungHinweis}>
        {(attribute) => (
          <select {...attribute} name="reviewId" defaultValue={beitrag?.reviewId ?? ""} className={`h-12 ${FELD}`}>
            <option value="">{texte.ohneBewertung}</option>
            {bewertungen.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variante={id ? "secondary" : "primary"} disabled={!hydriert || laeuft}>
          {laeuft ? texte.laeuft : texte.speichern}
        </Button>
        {id ? (
          <Button type="button" variante="primary" disabled={!hydriert || laeuft} onClick={() => void ausfuehren(true)}>
            {texte.einreichen}
          </Button>
        ) : null}
        <Link prefetch={false} href="/profil" className={buttonKlassen("ghost")}>
          {texte.schliessen}
        </Link>
      </div>

      {/* Stabile Region: der Text darin wird nachgereicht, Fehler tragen zusätzlich ein Wort davor. */}
      <p aria-live="polite" className={`min-h-6 text-small ${antwort?.art === "fehler" ? "text-danger" : "text-success"}`}>
        {antwort ? (
          <>
            {antwort.art === "fehler" ? <span className="font-medium">{texte.fehler} </span> : null}
            {antwort.text}
          </>
        ) : null}
      </p>
    </form>
  );
}
