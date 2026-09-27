"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";

import { istSprache, SPRACH_COOKIE } from "./sprache-kern";

const EIN_JAHR_SEKUNDEN = 365 * 24 * 60 * 60;

/** Ausdrueckliche Sprachwahl (Spec 4.2). Gilt fuer Gaeste wie Mitglieder, ohne Login. */
export async function spracheSetzen(formData: FormData): Promise<void> {
  const wahl = formData.get("sprache");
  if (!istSprache(wahl)) return;
  (await cookies()).set(SPRACH_COOKIE, wahl, {
    path: "/",
    maxAge: EIN_JAHR_SEKUNDEN,
    sameSite: "lax",
    secure: true,
    httpOnly: true,
  });
  refresh();
}
