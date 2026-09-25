"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signUp } from "@/lib/auth-client";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { profilSpeichern } from "@/app/mitglied/aktionen";
import { Button, Input } from "@/components/ui";
import { fehlertext } from "./fehlertexte";

type Props = {
  /** Schon geprueftes, relatives Ziel - siehe lib/weiterleitung.ts. */
  weiter: string;
};

/** Muss zu minPasswordLength in lib/auth.ts passen. */
const PASSWORT_MINDESTLAENGE = 10;

export function RegistrierFormular({ weiter }: Props) {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const daten = new FormData(ereignis.currentTarget);

    const anzeigename = String(daten.get("anzeigename") ?? "").trim();
    const passwort = String(daten.get("passwort") ?? "");
    const wiederholung = String(daten.get("wiederholung") ?? "");

    if (passwort !== wiederholung) {
      setFehler("Die beiden Passwörter stimmen nicht überein.");
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
      setFehler(fehlertext(error.code, "Die Registrierung ist fehlgeschlagen."));
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
        label="Anzeigename"
        name="anzeigename"
        type="text"
        required
        maxLength={60}
        autoComplete="nickname"
        autoFocus
        hinweis="Unter diesem Namen erscheinen deine Vorschläge und Bewertungen."
      />

      <Input
        id="registrieren-email"
        label="E-Mail-Adresse"
        name="email"
        type="email"
        required
        autoComplete="email"
      />

      <Input
        id="registrieren-instagram"
        label="Instagram-Name"
        name="instagramHandle"
        type="text"
        maxLength={30}
        autoComplete="off"
        hinweis="Freiwillig, hilft aber bei der Freigabe: darüber ist die Zuordnung zum Account nachvollziehbar."
      />

      <Input
        id="registrieren-passwort"
        label="Passwort"
        name="passwort"
        type="password"
        required
        minLength={PASSWORT_MINDESTLAENGE}
        autoComplete="new-password"
        hinweis={`Mindestens ${PASSWORT_MINDESTLAENGE} Zeichen.`}
      />

      <Input
        id="registrieren-wiederholung"
        label="Passwort wiederholen"
        name="wiederholung"
        type="password"
        required
        minLength={PASSWORT_MINDESTLAENGE}
        autoComplete="new-password"
      />

      {fehler ? (
        // Fehler nicht nur farblich: Klartext mit vorangestelltem Wortmarker.
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}

      <Button type="submit" disabled={laeuft}>
        {laeuft ? "Konto wird angelegt …" : "Konto anlegen"}
      </Button>
    </form>
  );
}
