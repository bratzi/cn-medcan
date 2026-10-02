"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { avatarEntfernen, avatarSpeichern } from "@/app/[lang]/mitglied/aktionen";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { Avatar, Button, useHydriert } from "@/components/ui";
import { AVATAR_MAX_BYTES, AVATAR_SEITE } from "@/lib/avatar";
import { bildVerkleinern } from "@/lib/bild-verkleinern";
import type { Meldung, Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";

type Props = {
  name: string;
  avatarId: string | null;
  texte: Woerterbuch["mitglied"]["avatar"];
  /** Nur die Meldungstexte, nicht das ganze Woerterbuch (Bundle). */
  meldungen: Woerterbuch["meldung"];
};

/**
 * Profilbild waehlen, im Browser auf 128 x 128 WebP zuschneiden und hochladen
 * (T8, Nutzer 2026-09-29). Die Server Action prueft Typ und Groesse erneut.
 */
export function AvatarFormular({ name, avatarId, texte, meldungen }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const eingabe = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function melden(m: Meldung): void {
    setFehler(t(meldungen[m.schluessel], m.parameter));
  }

  async function gewaehlt(ereignis: React.ChangeEvent<HTMLInputElement>) {
    const datei = ereignis.target.files?.[0];
    // Dieselbe Datei soll sich erneut waehlen lassen (nach einem Fehler).
    ereignis.target.value = "";
    if (!datei) return;
    setLaeuft(true);
    setFehler(null);
    setStatus(null);

    // Wirft etwas (Netz, Worker-Limit), duerfen die Knoepfe nicht gesperrt bleiben.
    try {
      const klein = await bildVerkleinern(datei, { seite: AVATAR_SEITE, maxBytes: AVATAR_MAX_BYTES });
      if (!klein.ok) {
        melden(klein.fehler);
        return;
      }
      const daten = new FormData();
      daten.set("bild", new File([klein.blob], "avatar.webp", { type: "image/webp" }));
      const ergebnis = await avatarSpeichern(daten);
      if (!ergebnis.ok) {
        setFehler(ergebnis.fehler);
        return;
      }
      setStatus(texte.gespeichert);
      zaehlerZuruecksetzen();
      router.refresh();
    } catch {
      setFehler(texte.unterbrochen);
    } finally {
      setLaeuft(false);
    }
  }

  async function entfernen() {
    setLaeuft(true);
    setFehler(null);
    setStatus(null);
    try {
      const ergebnis = await avatarEntfernen();
      if (!ergebnis.ok) {
        setFehler(ergebnis.fehler);
        return;
      }
      setStatus(texte.entfernt);
      zaehlerZuruecksetzen();
      router.refresh();
    } catch {
      setFehler(texte.unterbrochen);
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <Avatar name={name} bildId={avatarId} groesse="lg" />
        <div className="flex flex-col items-start gap-4">
          <p className="max-w-[56ch] text-small text-text-muted">{avatarId ? texte.hinweis : `${texte.ohneBild} ${texte.hinweis}`}</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={eingabe}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={gewaehlt}
              tabIndex={-1}
            />
            <Button variante="secondary" disabled={!hydriert || laeuft} onClick={() => eingabe.current?.click()}>
              {laeuft ? texte.laeuft : avatarId ? texte.wechseln : texte.waehlen}
            </Button>
            {avatarId ? (
              <Button variante="ghost" disabled={!hydriert || laeuft} onClick={entfernen}>
                {texte.entfernen}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {fehler ? (
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">{texte.fehler} </span>
          {fehler}
        </p>
      ) : null}
      {status && !fehler ? (
        <p role="status" className="text-small text-success">
          {status}
        </p>
      ) : null}
    </div>
  );
}
