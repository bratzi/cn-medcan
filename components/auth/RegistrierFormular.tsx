"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signUp } from "@/lib/auth-client";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { profilSpeichern } from "@/app/[lang]/mitglied/aktionen";
import { Button, Input, useHydriert } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";
import { fehlertext } from "./fehlertexte";

type Props = {
  /** Schon geprueftes, relatives Ziel - siehe lib/weiterleitung.ts. */
  weiter: string;
  texte: Woerterbuch["auth"]["formular"];
  fehlertexte: Woerterbuch["auth"]["fehler"];
};

/** Muss zu minPasswordLength in lib/auth.ts passen. */
const PASSWORT_MINDESTLAENGE = 10;

export function RegistrierFormular({ weiter, texte, fehlertexte }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);

    const anzeigename = String(daten.get("anzeigename") ?? "").trim();
    const passwort = String(daten.get("passwort") ?? "");
    const wiederholung = String(daten.get("wiederholung") ?? "");

    if (passwort !== wiederholung) {
      setFehler(texte.passwoerterUngleich);
      return;
    }

    setLaeuft(true);
    setFehler(null);

    const { error } = await signUp.email({
      email: String(daten.get("email") ?? ""),
      password: passwort,
      name: anzeigename,
    });

    if (error) {
      setFehler(fehlertext(fehlertexte, error.code, texte.registrierungFehlgeschlagen));
      setLaeuft(false);
      return;
    }

    // Der Instagram-Name gehoert zu `mitglied`, nicht zu Better Auth, und
    // wird deshalb erst nach der Registrierung gesetzt - jetzt mit Sitzung.
    // Schlaegt das fehl, ist das Konto trotzdem da: der Name laesst sich
    // unter /mitglied nachtragen, dafuer wird die Anmeldung nicht abgebrochen.
    const handle = String(daten.get("instagramHandle") ?? "").trim();
    if (handle.length > 0) {
      const nachtrag = new FormData();
      nachtrag.set("anzeigename", anzeigename);
      nachtrag.set("instagramHandle", handle);
      await profilSpeichern(nachtrag).catch(() => undefined);
    }

    zaehlerZuruecksetzen();
    router.push(weiter);
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input
        id="registrieren-anzeigename"
        label={texte.anzeigename}
        name="anzeigename"
        type="text"
        required
        maxLength={60}
        autoComplete="nickname"
        autoFocus
        hinweis={texte.anzeigenameHinweis}
      />

      <Input
        id="registrieren-email"
        label={texte.email}
        name="email"
        type="email"
        required
        autoComplete="email"
      />

      <Input
        id="registrieren-instagram"
        label={texte.instagram}
        name="instagramHandle"
        type="text"
        maxLength={30}
        autoComplete="off"
        hinweis={texte.instagramHinweis}
      />

      <Input
        id="registrieren-passwort"
        label={texte.passwort}
        name="passwort"
        type="password"
        required
        minLength={PASSWORT_MINDESTLAENGE}
        autoComplete="new-password"
        hinweis={t(texte.passwortHinweis, { anzahl: PASSWORT_MINDESTLAENGE })}
      />

      <Input
        id="registrieren-wiederholung"
        label={texte.wiederholen}
        name="wiederholung"
        type="password"
        required
        minLength={PASSWORT_MINDESTLAENGE}
        autoComplete="new-password"
      />

      {fehler ? (
        // Fehler nicht nur farblich: Klartext mit vorangestelltem Wortmarker.
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">{texte.fehler} </span>
          {fehler}
        </p>
      ) : null}

      <Button type="submit" disabled={!hydriert || laeuft}>
        {laeuft ? texte.wirdAngelegt : texte.anlegen}
      </Button>
    </form>
  );
}
