import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zugang - cn-medcan",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ weiter?: string; fehler?: string }>;
};

export default async function ZugangPage({ searchParams }: Props) {
  const { weiter = "/", fehler } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-sunken p-4">
      <div className="w-full max-w-100 rounded-lg border border-border bg-surface p-8 shadow-md">
        <h1 className="text-h2 text-text">Geschlossene Entwicklungsphase</h1>
        <p className="mt-2 text-small text-text-muted">
          Diese Seite ist noch nicht oeffentlich. Bitte Zugangspasswort eingeben.
        </p>

        <form action="/api/zugang" method="post" className="mt-8 flex flex-col gap-4">
          <input type="hidden" name="weiter" value={weiter} />

          <div className="flex flex-col gap-2">
            <label htmlFor="passwort" className="text-small font-medium text-text">
              Passwort
            </label>
            <input
              id="passwort"
              name="passwort"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              aria-describedby={fehler ? "zugang-fehler" : undefined}
              aria-invalid={fehler ? true : undefined}
              className="h-11 rounded-md border border-border-strong bg-surface px-4 text-body text-text outline-none transition-colors duration-150 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
          </div>

          {fehler ? (
            <p id="zugang-fehler" role="alert" className="text-small text-danger">
              Passwort falsch. Bitte erneut versuchen.
            </p>
          ) : null}

          <button
            type="submit"
            className="h-11 rounded-md bg-accent px-6 text-small font-medium text-accent-fg transition-opacity duration-150 ease-standard hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Weiter
          </button>
        </form>
      </div>
    </main>
  );
}
