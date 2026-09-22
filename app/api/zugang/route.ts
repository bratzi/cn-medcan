import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, GUELTIGKEIT_SEKUNDEN, passwortPruefen, tokenErzeugen } from "@/lib/gate";

export async function POST(request: NextRequest) {
  const passwort = process.env.SITE_PASSWORD;
  const secret = process.env.SITE_SESSION_SECRET;

  if (!passwort || !secret) {
    return NextResponse.json(
      { fehler: "Zugangsschutz ist nicht konfiguriert." },
      { status: 500 }
    );
  }

  const formular = await request.formData();
  const eingabe = String(formular.get("passwort") ?? "");
  const weiter = String(formular.get("weiter") ?? "/");

  if (!(await passwortPruefen(passwort, eingabe))) {
    const zurueck = new URL("/zugang", request.url);
    zurueck.searchParams.set("fehler", "1");
    zurueck.searchParams.set("weiter", weiter);
    return NextResponse.redirect(zurueck, { status: 303 });
  }

  // Nur relative Ziele zulassen - verhindert Open Redirect.
  const sicheresZiel = weiter.startsWith("/") && !weiter.startsWith("//") ? weiter : "/";

  const antwort = NextResponse.redirect(new URL(sicheresZiel, request.url), { status: 303 });
  antwort.cookies.set(COOKIE_NAME, await tokenErzeugen(secret), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUELTIGKEIT_SEKUNDEN,
  });
  return antwort;
}
