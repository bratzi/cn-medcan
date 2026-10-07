"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { profilSichtbarkeitSetzen } from "@/app/[lang]/mitglied/aktionen";
import { Badge, Button, textLinkKlassen, useHydriert } from "@/components/ui";
import { profilHref } from "@/lib/kurz-id";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  an: boolean;
  kurzId: string | null;
  /** Einschalten erst mit freigegebenem Konto (Review W2); Ausschalten geht immer. */
  moeglich?: boolean;
  texte: Woerterbuch["mitglied"]["sichtbarkeit"];
};

/**
 * Schalter „Öffentliches Profil“ (Spec Profil 9). Zustand als Klartext und
 * Badge, nie nur Farbe. Ein Knopf statt Checkbox: die Wirkung ist eine
 * Veröffentlichung, die soll bewusst ausgelöst werden.
 */
export function ProfilSichtbarkeit({ an, kurzId, moeglich = true, texte }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function umschalten() {
    setLaeuft(true);
    setFehler(null);
    const ergebnis = await profilSichtbarkeitSetzen(!an).catch(() => ({ ok: false as const, fehler: texte.fehler }));
    setLaeuft(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }
    router.refresh();
  }

  const href = an && kurzId ? profilHref(kurzId) : null;
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.satz}</p>
      {/* role="status": nach dem Umschalten wird der neue Zustand vorgelesen (Review Minor 7). */}
      <p role="status" className="flex flex-wrap items-center gap-2 text-body text-text">
        <Badge variante={an ? "success" : "neutral"}>{an ? texte.istAn : texte.istAus}</Badge>
      </p>
      {href ? (
        <p className="flex flex-col gap-2 text-small text-text-muted">
          <span className="wrap-break-word">{t(texte.adresse, { adresse: href })}</span>
          <Link prefetch={false} href={href} className={textLinkKlassen()}>
            {texte.ansehen}
          </Link>
        </p>
      ) : null}
      {fehler ? (
        <p role="alert" className="text-small text-danger">
          {fehler}
        </p>
      ) : null}
      {an || moeglich ? (
        <Button type="button" variante="secondary" onClick={umschalten} disabled={!hydriert || laeuft}>
          {laeuft ? texte.laeuft : an ? texte.ausschalten : texte.einschalten}
        </Button>
      ) : (
        <p className="max-w-[68ch] text-small text-text-muted">{texte.erstNachFreigabe}</p>
      )}
    </div>
  );
}
