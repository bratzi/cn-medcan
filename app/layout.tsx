import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "cn-medcan — Katalog verschreibungspflichtiger Cannabisarzneimittel",
    template: "%s · cn-medcan",
  },
  description:
    "Übersicht verschreibungspflichtiger Cannabisarzneimittel nach BfArM-Handelsnamen mit Angaben zur Verfügbarkeit in Versandapotheken.",
  robots: { index: false, follow: false },
};

const NAV_LINK =
  "inline-flex h-11 items-center rounded-md px-4 text-small font-medium text-text " +
  "transition-opacity duration-150 ease-standard hover:opacity-70 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:inline-flex focus:h-11 focus:items-center focus:rounded-md focus:bg-accent focus:px-4 focus:text-small focus:font-medium focus:text-accent-fg"
        >
          Direkt zum Inhalt
        </a>

        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-md px-2 text-h3 text-text transition-opacity duration-150 ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              cn-medcan
            </Link>

            <nav aria-label="Hauptnavigation">
              <ul className="flex items-center gap-2">
                <li>
                  <Link href="/produkte" className={NAV_LINK}>
                    Produkte
                  </Link>
                </li>
                <li>
                  <Link href="/apotheken" className={NAV_LINK}>
                    Apotheken
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="inhalt" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-border bg-surface-raised">
          <div className="mx-auto w-full max-w-360 px-4 py-8 sm:px-8">
            <p className="max-w-[68ch] text-caption text-text-muted">
              Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben
              dienen der Information und ersetzen keine medizinische oder
              pharmazeutische Beratung. Eine Abgabe von Arzneimitteln erfolgt über
              diese Seite nicht.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
