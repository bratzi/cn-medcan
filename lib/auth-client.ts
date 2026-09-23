"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Anmeldung im Browser. Ohne baseURL laufen die Aufrufe gegen den eigenen
 * Ursprung - die Auth-Route liegt in derselben Anwendung
 * (app/api/auth/[...all]/route.ts).
 *
 * Der Client ist die Bedienoberflaeche, nicht die Zugriffskontrolle: was ein
 * Mitglied darf, entscheidet lib/session.ts auf dem Server.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
