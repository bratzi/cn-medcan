/**
 * Deutsches Woerterbuch, Quelle der Wahrheit (Spec Englisch 5.1).
 * Gegliedert nach Bereich. Platzhalter {name}; Mehrzahl als { one, other }.
 * Meldungen (Rueckgaben von Pruefungen und Server Actions) flach unter
 * `meldung` mit Punkt-Schluesseln, damit MeldungSchluessel ein einfacher
 * Schluesseltyp bleibt.
 */
export const de = {
  rahmen: {
    direktZumInhalt: "Direkt zum Inhalt",
    beschreibung:
      "Bewertungen verschreibungspflichtiger Cannabisarzneimittel nach festem Schema, jeweils an eine Charge gebunden. Die Community stimmt ab, welche Sorte als Nächstes bewertet wird.",
  },
  sprache: {
    gruppe: "Sprache",
  },
  kopf: {
    hauptnavigation: "Hauptnavigation",
    navigation: {
      bewertungen: "Bewertungen",
      abstimmung: "Abstimmung",
      blueten: "Blüten",
      konto: "Mein Konto",
    },
    ungelesen: {
      one: "{anzahl} ungelesene Benachrichtigung",
      other: "{anzahl} ungelesene Benachrichtigungen",
    },
    thema: {
      dunkel: "Licht aus, dunkel darstellen",
      hell: "Licht an, hell darstellen",
    },
  },
  fuss: {
    schlusszeile: "Wir lesen mit. Wir wählen mit.",
    zurueckNachOben: "Zurück zum Anfang ↑",
    navigation: "Fußnavigation",
    inhalt: "Inhalt",
    hinweis:
      "Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der Information und ersetzen keine medizinische oder pharmazeutische Beratung. Eine Abgabe von Arzneimitteln erfolgt über diese Seite nicht.",
    bildnachweise: "Bildnachweise",
    foto: "Foto",
    video: "Video",
    aufPexels: " auf Pexels",
    rechtliches: "Rechtliches",
    impressum: "Impressum",
    datenschutz: "Datenschutz",
  },
  fehlerseite: {
    nichtGefunden: "Seite nicht gefunden",
    nichtGefundenSatz: "Die aufgerufene Adresse existiert nicht oder der Eintrag wurde aus dem Katalog entfernt.",
    zurStartseite: "Zur Startseite",
    zumKatalog: "Zum Blütenkatalog",
  },
  auth: {
    anmelden: {
      titel: "Anmelden",
      satz: "Für Vorschläge und Abstimmungen. Das Stimmrecht vergibt der Betreiber nach der Registrierung von Hand.",
      keinKonto: "Noch kein Konto?",
      kontoAnlegen: "Konto anlegen",
    },
    registrieren: {
      titel: "Konto anlegen",
      satz: "Die Registrierung ist offen. Das Stimmrecht gibt der Betreiber anschließend von Hand frei — eine Bestätigungsmail gibt es nicht.",
      schonKonto: "Schon ein Konto?",
      anmelden: "Anmelden",
    },
    formular: {
      email: "E-Mail-Adresse",
      passwort: "Passwort",
      fehler: "Fehler:",
      anmelden: "Anmelden",
      wirdGeprueft: "Wird geprüft …",
      anmeldungFehlgeschlagen: "Die Anmeldung ist fehlgeschlagen.",
      anzeigename: "Anzeigename",
      anzeigenameHinweis: "Unter diesem Namen erscheinen deine Vorschläge und Bewertungen.",
      instagram: "Instagram-Name",
      instagramHinweis: "Freiwillig, hilft aber bei der Freigabe: darüber ist die Zuordnung zum Account nachvollziehbar.",
      passwortHinweis: "Mindestens {anzahl} Zeichen.",
      wiederholen: "Passwort wiederholen",
      passwoerterUngleich: "Die beiden Passwörter stimmen nicht überein.",
      registrierungFehlgeschlagen: "Die Registrierung ist fehlgeschlagen.",
      anlegen: "Konto anlegen",
      wirdAngelegt: "Konto wird angelegt …",
      abmelden: "Abmelden",
      wirdAbgemeldet: "Wird abgemeldet …",
    },
    fehler: {
      USER_ALREADY_EXISTS: "Für diese E-Mail-Adresse besteht bereits ein Konto.",
      INVALID_EMAIL_OR_PASSWORD: "E-Mail-Adresse oder Passwort ist falsch.",
      INVALID_EMAIL: "Diese E-Mail-Adresse ist nicht gültig.",
      INVALID_PASSWORD: "E-Mail-Adresse oder Passwort ist falsch.",
      PASSWORD_TOO_SHORT: "Das Passwort ist zu kurz (mindestens 10 Zeichen).",
      PASSWORD_TOO_LONG: "Das Passwort ist zu lang.",
      USER_NOT_FOUND: "E-Mail-Adresse oder Passwort ist falsch.",
      FAILED_TO_CREATE_USER: "Das Konto konnte nicht angelegt werden.",
    },
  },
  zugang: {
    titel: "Zugang",
    ueberschrift: "Geschlossene Entwicklungsphase",
    satz: "Diese Seite ist noch nicht öffentlich. Bitte Zugangspasswort eingeben.",
    passwort: "Passwort",
    falsch: "Passwort falsch. Bitte erneut versuchen.",
    weiter: "Weiter",
  },
  meldung: {
    "allgemein.unbekannt": "Das hat nicht geklappt. Bitte erneut versuchen.",
  },
} as const;
