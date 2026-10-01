import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { getEnv } from "@/lib/cloudflare";
import { getPrisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Better Auth fuer Cloudflare D1.
 *
 * Kein eigener D1- oder Drizzle-Adapter: die Datenbank laeuft in diesem
 * Projekt ohnehin ueber Prisma, also nimmt Better Auth denselben Client.
 * Das haelt Migrationen auf einem Pfad (prisma/schema.prisma ->
 * `prisma migrate diff` -> wrangler, siehe db/README.md).
 *
 * `transaction: false` ist Pflicht, nicht Geschmackssache: D1 kennt keine
 * echten Transaktionen, Prisma faehrt `$transaction` dort als Einzelabfragen.
 * Mit `true` wuerde Better Auth eine Garantie annehmen, die es nicht gibt.
 *
 * Wie Prisma kann das kein Modul-Singleton sein - das Binding existiert erst
 * im Request-Kontext. Gecacht wird pro Isolate, aber nur solange derselbe
 * Prisma-Client kommt (Bindingwechsel -> neue Instanz statt falscher
 * Datenbank).
 */

type AuthInstanz = ReturnType<typeof erzeugen>;

type GlobalerCache = {
  authInstanz?: AuthInstanz;
  authPrisma?: PrismaClient;
};

const globalerCache = globalThis as unknown as GlobalerCache;

function erzeugen(prisma: PrismaClient, secret: string, baseURL: string | undefined) {
  return betterAuth({
    appName: "cn-medcan",
    secret,
    baseURL,
    database: prismaAdapter(prisma, { provider: "sqlite", transaction: false }),

    emailAndPassword: {
      enabled: true,
      // Kein Mailversand-Dienst im Projekt: die Verifizierung ist bewusst
      // keine E-Mail-Bestaetigung, sondern die manuelle Freigabe durch den
      // Betreiber (mitglied.freigegeben). Eine bestaetigte Adresse wuerde
      // hier nichts absichern, was die Freigabe nicht schon absichert.
      requireEmailVerification: false,
      minPasswordLength: 10,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 Tage
      updateAge: 60 * 60 * 24, // taeglich verlaengern
    },

    databaseHooks: {
      user: {
        create: {
          // Zu jedem Better-Auth-Nutzer gehoert ein `mitglied`-Satz mit
          // unseren Feldern. Er entsteht hier, direkt nach der Registrierung.
          //
          // D1 hat keine Transaktion: schlaegt dieser Schritt fehl, bleibt ein
          // Nutzer ohne Mitgliedssatz zurueck. Deshalb legt mitgliedZuUser()
          // in lib/session.ts ihn notfalls nach - ohne Freigabe, die bleibt
          // in jedem Fall eine bewusste Handlung des Betreibers.
          after: async (user) => {
            await prisma.mitglied.upsert({
              where: { userId: user.id },
              create: { userId: user.id, anzeigename: user.name },
              update: {},
            });
          },
        },
      },
    },

    advanced: {
      // Die Seite laeuft nur ueber HTTPS (Workers) bzw. localhost.
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
}

export async function getAuth(): Promise<AuthInstanz> {
  const prisma = await getPrisma();

  if (globalerCache.authInstanz && globalerCache.authPrisma === prisma) {
    return globalerCache.authInstanz;
  }

  const env = (await getEnv()) as unknown as Record<string, string | undefined>;
  const secret = process.env.BETTER_AUTH_SECRET ?? env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET fehlt. Lokal in .env.local eintragen " +
        "(mind. 32 Zeichen, z. B. `openssl rand -base64 32`), fuer den Worker " +
        "mit `wrangler secret put BETTER_AUTH_SECRET` setzen."
    );
  }

  // Ohne gesetzte URL leitet Better Auth die Herkunft aus dem Request ab.
  // In Produktion gesetzt lassen, sonst zeigen Links aus Mails und
  // OAuth-Rueckleitungen auf den falschen Host.
  const baseURL = process.env.BETTER_AUTH_URL ?? env.BETTER_AUTH_URL;

  const instanz = erzeugen(prisma, secret, baseURL);
  globalerCache.authInstanz = instanz;
  globalerCache.authPrisma = prisma;
  return instanz;
}
