import type { Woerterbuch } from "./typen";

/** Englisches Woerterbuch (en-GB). Fehlende oder ueberzaehlige Schluessel sind Compilerfehler. */
export const en: Woerterbuch = {
  rahmen: {
    direktZumInhalt: "Skip to content",
    beschreibung:
      "Reviews of prescription medical cannabis following a fixed scheme, each tied to one batch. The community votes on which strain is reviewed next.",
  },
  sprache: {
    gruppe: "Language",
  },
  kopf: {
    hauptnavigation: "Main navigation",
    navigation: {
      bewertungen: "Reviews",
      abstimmung: "Vote",
      blueten: "Flowers",
      konto: "My account",
    },
    ungelesen: {
      one: "{anzahl} unread notification",
      other: "{anzahl} unread notifications",
    },
    thema: {
      dunkel: "Lights off, dark mode",
      hell: "Lights on, light mode",
    },
  },
  fuss: {
    schlusszeile: "We read along. We vote along.",
    zurueckNachOben: "Back to top ↑",
    navigation: "Footer navigation",
    inhalt: "Contents",
    hinweis:
      "All listed medicines are prescription-only. The information is provided for reference and does not replace medical or pharmaceutical advice. No medicines are dispensed through this site.",
    bildnachweise: "Image credits",
    foto: "Photo",
    video: "Video",
    aufPexels: " on Pexels",
    rechtliches: "Legal",
    impressum: "Legal notice",
    datenschutz: "Privacy",
  },
  fehlerseite: {
    nichtGefunden: "Page not found",
    nichtGefundenSatz: "The address does not exist, or the entry has been removed from the catalogue.",
    zurStartseite: "To the home page",
    zumKatalog: "To the flower catalogue",
  },
  auth: {
    anmelden: {
      titel: "Sign in",
      satz: "For suggestions and votes. The operator grants voting rights by hand after you register.",
      keinKonto: "No account yet?",
      kontoAnlegen: "Create account",
    },
    registrieren: {
      titel: "Create account",
      satz: "Registration is open. The operator then grants voting rights by hand — there is no confirmation email.",
      schonKonto: "Already have an account?",
      anmelden: "Sign in",
    },
    formular: {
      email: "Email address",
      passwort: "Password",
      fehler: "Error:",
      anmelden: "Sign in",
      wirdGeprueft: "Checking …",
      anmeldungFehlgeschlagen: "Sign-in failed.",
      anzeigename: "Display name",
      anzeigenameHinweis: "Your suggestions and reviews appear under this name.",
      instagram: "Instagram name",
      instagramHinweis: "Optional, but it helps with approval: it lets us match you to your account.",
      passwortHinweis: "At least {anzahl} characters.",
      wiederholen: "Repeat password",
      passwoerterUngleich: "The two passwords do not match.",
      registrierungFehlgeschlagen: "Registration failed.",
      anlegen: "Create account",
      wirdAngelegt: "Creating account …",
      abmelden: "Sign out",
      wirdAbgemeldet: "Signing out …",
    },
    fehler: {
      USER_ALREADY_EXISTS: "An account already exists for this email address.",
      INVALID_EMAIL_OR_PASSWORD: "Email address or password is incorrect.",
      INVALID_EMAIL: "This email address is not valid.",
      INVALID_PASSWORD: "Email address or password is incorrect.",
      PASSWORD_TOO_SHORT: "The password is too short (at least 10 characters).",
      PASSWORD_TOO_LONG: "The password is too long.",
      USER_NOT_FOUND: "Email address or password is incorrect.",
      FAILED_TO_CREATE_USER: "The account could not be created.",
    },
  },
  zugang: {
    titel: "Access",
    ueberschrift: "Closed development phase",
    satz: "This site is not public yet. Please enter the access password.",
    passwort: "Password",
    falsch: "Wrong password. Please try again.",
    weiter: "Continue",
  },
  meldung: {
    "allgemein.unbekannt": "That did not work. Please try again.",
  },
};
