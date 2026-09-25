import type { Metadata } from "next";
import { Inspiration, Newsreader } from "next/font/google";
import { JointCursor } from "@/components/layout/JointCursor";
import { Fuss } from "@/components/layout/Fuss";
import { Kopf } from "@/components/layout/Kopf";
import { THEMA_SKRIPT, THEMA_STANDARD } from "@/lib/thema";
import "./globals.css";

/**
 * Eine von zwei Familien (Spec Redesign 11): Newsreader trägt alles Gedruckte,
 * von der Story bis zur Bedienung und den Zahlen. Variabel 200 bis 800 mit
 * optischer Größe, normal und kursiv. Die zweite Familie ist Inspiration.
 */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

/** Handschrift (Spec TP3 4): Wortmarke und Randnotizen. Ein Schnitt, eine Datei. */
const inspiration = Inspiration({
  variable: "--font-inspiration",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "Book of Terpz",
    template: "%s · Book of Terpz",
  },
  description:
    "Bewertungen verschreibungspflichtiger Cannabisarzneimittel nach festem Schema, jeweils an eine Charge gebunden. Die Community stimmt ab, welche Sorte als Nächstes bewertet wird.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      data-theme={THEMA_STANDARD}
      suppressHydrationWarning
      className={`${newsreader.variable} ${inspiration.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEMA_SKRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-full focus:bg-accent focus:px-4 focus:text-small focus:font-medium focus:text-accent-fg"
        >
          Direkt zum Inhalt
        </a>

        <Kopf />

        <main id="inhalt" className="flex-1 pt-(--kopf-h,4rem)">
          {children}
        </main>

        <Fuss />
        <JointCursor />
      </body>
    </html>
  );
}
