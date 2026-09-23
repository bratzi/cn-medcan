import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_NAME,
  GUELTIGKEIT_SEKUNDEN,
  passwortPruefen,
  tokenErzeugen,
  type GateRolle,
} from "@/lib/gate";

export async function POST(request: NextRequest) {
  const passwort = process.env.SITE_PASSWORD;
  const secret = process.env.SITE_SESSION_SECRET;

  if (!passwort || !secret) {
    return NextResponse.json(
      { fehler: "Zugangsschutz ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  // Zweites, anderes Passwort: wer es kennt, bekommt zusaetzlich das
  // Fachkreis-Recht und sieht damit Preise und Bestaende (Paragraph 10 HWG).
  // Optional - fehlt es, gibt es nur die Besucherrolle.
  const fachkreisPasswort = process.env.FACHKREIS_PASSWORD;

  const formular = await request.formData();
  const eingabe = String(formular.get("passwort") ?? "");
  const weiter = String(formular.get("weiter") ?? "/");

  // Reihenfolge: erst das Fachkreis-Passwort, sonst gewaenne bei identischen
  // Passwoertern immer die schwaechere Rolle. Beide werden geprueft, damit die
  // Antwortzeit nicht verraet, welches der beiden getroffen hat.
  const [alsFachkreis, alsBesucher] = await Promise.all([
    fachkreisPasswort
      ? passwortPruefen(fachkreisPasswort, eingabe)
      : Promise.resolve(false),
    passwortPruefen(passwort, eingabe),
  ]);

  const rolle: GateRolle | null = alsFachkreis
    ? "fachkreis"
    : alsBesucher
      ? "besucher"
      : null;

  if (rolle === null) {
    const zurueck = new URL("/zugang", request.url);
    zurueck.searchParams.set("fehler", "1");
    zurueck.searchParams.set("weiter", weiter);
    return NextResponse.redirect(zurueck, { status: 303 });
  }

  // Nur relative Ziele zulassen - verhindert Open Redirect.
  const sicheresZiel = weiter.startsWith("/") && !weiter.startsWith("//") ? weiter : "/";

  const antwort = NextResponse.redirect(new URL(sicheresZiel, request.url), { status: 303 });
  antwort.cookies.set(COOKIE_NAME, await tokenErzeugen(secret, rolle), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUELTIGKEIT_SEKUNDEN,
  });
  return antwort;
}
