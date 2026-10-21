/**
 * Meldungen der Seite /neu (Spec 2026-10-20-neuigkeiten-design.md).
 * Claude trägt nach jeder sichtbaren Auslieferung eine Meldung ein, neueste oben.
 * Kurze Sätze für Mitglieder ohne Technikwissen; tests/neuigkeiten.test.ts wacht
 * über Längen und verbotene Wörter.
 */

export type Art = "neu" | "besser" | "behoben";
export type Zweisprachig = { de: string; en: string };

export type Neuigkeit = {
  /** Stabil, kebab-case, mit Datum vorne. */
  id: string;
  /** ISO-Datum der Auslieferung. */
  datum: string;
  art: Art;
  titel: Zweisprachig;
  /** Ein bis drei kurze Sätze. */
  text: Zweisprachig;
  /** Seite, auf der man es sieht. */
  link?: string;
};

export type InArbeit = { id: string; titel: Zweisprachig; text: Zweisprachig };

export const NEUIGKEITEN: readonly Neuigkeit[] = [
  {
    id: "2026-10-21-strainseite-ruhiger",
    datum: "2026-10-21",
    art: "besser",
    titel: { de: "Strain-Seite aufgeräumt", en: "Strain page tidied up" },
    text: {
      de: "Erst der Strain, dann die Angaben, dann der Hersteller als Leiste mit Logos. Lange Erklärungen stehen hinter dem Info-Knopf, die Sortierung lässt sich umdrehen.",
      en: "Strain first, then the facts, then the producer as a bar with logos. Long explanations sit behind the info button, and sorting can be reversed.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-21-strains-neue-filter",
    datum: "2026-10-21",
    art: "neu",
    titel: { de: "Strains filtern geht jetzt schneller", en: "Filtering strains is faster now" },
    text: {
      de: "Filter sitzen als Chips über der Liste, Sortierung mit einem Klick. Die Karten zeigen zuerst Note, Terpene und THC.",
      en: "Filters sit as chips above the list, sorting takes one click. Cards show rating, terpenes and THC first.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-20-strainkarten-passen",
    datum: "2026-10-20",
    art: "behoben",
    titel: { de: "Strain-Karten passen wieder", en: "Strain cards fit again" },
    text: {
      de: "Karten mit Bewertung ragten über ihre Spalte hinaus. Jetzt bleibt jede Karte in ihrem Platz.",
      en: "Cards with a rating spilled over their column. Now every card stays in place.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-20-strains-laedt-wieder",
    datum: "2026-10-20",
    art: "behoben",
    titel: { de: "Strains-Seite lädt wieder", en: "Strains page loads again" },
    text: {
      de: "Die Strains-Seite fiel manchmal mit einer Fehlermeldung aus. Jetzt ist sie fertig vorbereitet und öffnet sich schnell.",
      en: "The strains page sometimes failed with an error. Now it is prepared ahead and opens fast.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-20-startseite-bewertung-katalog",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Startseite: Bewertung und Katalog in einem", en: "Home: review and catalogue in one" },
    text: {
      de: "Such dir auf der Startseite eine Sorte aus. Darunter siehst du gleich ihre Bewertung.",
      en: "Pick a strain on the home page. Its review shows up right below.",
    },
    link: "/",
  },
  {
    id: "2026-10-20-info-knoepfe-lesbar",
    datum: "2026-10-20",
    art: "behoben",
    titel: { de: "Hinweise besser lesbar", en: "Hints easier to read" },
    text: {
      de: "Die kleinen i-Knöpfe zeigen ihren Hinweis jetzt ganz und kürzer. Er wird nicht mehr abgeschnitten.",
      en: "The small i buttons now show their hint in full and shorter. It no longer gets cut off.",
    },
  },
  {
    id: "2026-10-20-zugang",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Schönerer Einstieg", en: "A nicer way in" },
    text: {
      de: "Die Seite mit dem Kennwort sieht jetzt aus wie unsere Startseite.",
      en: "The password page now looks like our home page.",
    },
  },
  {
    id: "2026-10-20-bluetenseite-filtern",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Blütenseite: Filtern ohne Warten", en: "Flowers page: filter without waiting" },
    text: {
      de: "Filter, Sortierung und Blättern wirken sofort, ohne dass die Seite neu lädt. Die Community-Note steht jetzt vorn auf jeder Karte.",
      en: "Filters, sorting and paging now apply instantly without reloading the page. The community rating now leads on every card.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-20-neuigkeiten",
    datum: "2026-10-20",
    art: "neu",
    titel: { de: "Diese Seite ist neu", en: "This page is new" },
    text: {
      de: "Hier steht ab jetzt, was sich am Book of Terpz ändert. Kurz und ohne Fachchinesisch.",
      en: "From now on, this is where you see what changes on Book of Terpz. Short and without jargon.",
    },
  },
  {
    id: "2026-10-20-adresse",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Neue, kürzere Adresse", en: "Shorter new address" },
    text: {
      de: "Book of Terpz liegt jetzt unter www.bookofterpz.workers.dev. Speicher dir am besten gleich das neue Lesezeichen.",
      en: "Book of Terpz now lives at www.bookofterpz.workers.dev. Best save the new bookmark right away.",
    },
  },
  {
    id: "2026-10-20-terpen-register",
    datum: "2026-10-20",
    art: "neu",
    titel: { de: "Alle 24 Terpene im Register", en: "All 24 terpenes in the register" },
    text: {
      de: "Jedes Terpen hat jetzt Duft, Vorkommen und ein eigenes Icon. So erkennst du schneller, was in deiner Blüte steckt.",
      en: "Every terpene now has its scent, where it occurs and its own icon. You spot faster what's in your flower.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-20-info-knoepfe",
    datum: "2026-10-20",
    art: "neu",
    titel: { de: "Kleine Info-Knöpfe für schnelle Hilfe", en: "Small info buttons for quick help" },
    text: {
      de: "Wo ein Begriff Fragen aufwirft, sitzt jetzt ein runder Info-Knopf. Tipp drauf, und du liest die Erklärung direkt an Ort und Stelle.",
      en: "Where a term raises questions, there's now a small round info button. Tap it to read the explanation right there.",
    },
  },
  {
    id: "2026-10-20-blaetter",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Feinere Blätter für die Gesamtnote", en: "Finer leaves for the overall score" },
    text: {
      de: "Die Blätter der Gesamtnote sind neu gezeichnet, mit gesägten Fingern und feinen Adern. Halbe Noten liest du so auf einen Blick.",
      en: "The leaves of the overall score are redrawn with serrated fingers and fine veins. Half scores are now easy to read at a glance.",
    },
    link: "/reviews",
  },
  {
    id: "2026-10-20-musterbilder",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Neue Musterbilder für Blüten", en: "New sample photos for flowers" },
    text: {
      de: "Blüten ohne eigenes Foto zeigen jetzt eines von 16 neuen Musterbildern. Echte Budpics der Community gehen weiter vor.",
      en: "Flowers without their own photo now show one of 16 new sample images. Real budpics from the community still come first.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-20-sotm",
    datum: "2026-10-20",
    art: "neu",
    titel: { de: "Strain of the Month", en: "Strain of the Month" },
    text: {
      de: "Jeden Monat wählt die Community ihren Strain of the Month. Stimm mit ab und sieh, welche Blüte gerade vorne liegt.",
      en: "Every month the community picks its Strain of the Month. Cast your vote and see which flower is in the lead.",
    },
    link: "/sotm",
  },
  {
    id: "2026-10-20-wirkung-ring",
    datum: "2026-10-20",
    art: "neu",
    titel: { de: "Bewerten mit Blick auf die Community", en: "Rate with the community in view" },
    text: {
      de: "Beim Bewerten siehst du jetzt, was andere Mitglieder zur Wirkung notiert haben. Die Terpene laut Datenblatt sind schon vorausgewählt.",
      en: "While rating, you now see what other members noted about the effect. Terpenes from the data sheet are already preselected.",
    },
    link: "/reviews",
  },
  {
    id: "2026-10-20-startseite",
    datum: "2026-10-20",
    art: "besser",
    titel: { de: "Startseite neu sortiert", en: "Home page in a new order" },
    text: {
      de: "Erst die Geschichte, dann Dein Kapitel, dann die Bewertung in drei Schritten. Gleich oben wartet schon eine Blüte auf dich.",
      en: "First the story, then Your Chapter, then rating in three steps. A flower is waiting for you right at the top.",
    },
    link: "/",
  },
  {
    id: "2026-10-20-stimmen-zaehlen",
    datum: "2026-10-20",
    art: "behoben",
    titel: { de: "Stimmen richtig gezählt", en: "Votes counted correctly" },
    text: {
      de: "Bei genau einer Stimme stand vorher „1 Stimmen“. Das Wort passt jetzt immer zur Zahl.",
      en: "With exactly one vote it used to say “1 votes”. The word now always matches the number.",
    },
    link: "/sotm",
  },
  {
    id: "2026-10-16-jury",
    datum: "2026-10-16",
    art: "neu",
    titel: { de: "Die Terpz-Jury ist da", en: "Meet the Terpz Jury" },
    text: {
      de: "Ausgewählte Mitglieder schreiben ausführliche Reviews mit Bildern. Ihre Favourites findest du gesammelt an einem Ort.",
      en: "Selected members write in-depth reviews with photos. You find their favourites collected in one place.",
    },
    link: "/jury",
  },
  {
    id: "2026-10-16-score",
    datum: "2026-10-16",
    art: "besser",
    titel: { de: "Aus Fazit wird Score", en: "Verdict becomes score" },
    text: {
      de: "Die Gesamtwertung heißt jetzt Score. Du siehst getrennt, was die Community, Terpz und der Vertreiber sagen.",
      en: "The overall rating is now called score. You see separately what the community, Terpz and the distributor say.",
    },
    link: "/reviews",
  },
  {
    id: "2026-10-16-bluetenkarte",
    datum: "2026-10-16",
    art: "besser",
    titel: { de: "Blütenkarten wie Buchseiten", en: "Flower cards like book pages" },
    text: {
      de: "Jede Blütenkarte zeigt den Strain groß, dazu CBD-Spanne und die wichtigsten Terpene. So vergleichst du schneller.",
      en: "Each flower card shows the strain big, plus CBD range and the main terpenes. That makes comparing faster.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-15-sortenseite",
    datum: "2026-10-15",
    art: "neu",
    titel: { de: "Eine Seite je Strain", en: "One page per strain" },
    text: {
      de: "Alle Bewertungen eines Strains stehen jetzt auf einer Seite, egal von welchem Vertreiber. Oben wählst du die Variante, die dich interessiert.",
      en: "All ratings of a strain are now on one page, whichever distributor sells it. At the top you pick the variant you care about.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-15-explorer",
    datum: "2026-10-15",
    art: "neu",
    titel: { de: "Strains auf der Startseite entdecken", en: "Explore strains on the home page" },
    text: {
      de: "Such auf der Startseite nach einem Strain und sieh sofort, bei welchen Vertreibern es ihn gibt.",
      en: "Search for a strain on the home page and see right away which distributors carry it.",
    },
    link: "/",
  },
  {
    id: "2026-10-14-likes",
    datum: "2026-10-14",
    art: "neu",
    titel: { de: "Herzen für Bewertungen und Blüten", en: "Hearts for ratings and flowers" },
    text: {
      de: "Gefällt dir eine Bewertung, gib ihr ein Herz. Auch Blüten und Profile kannst du so markieren.",
      en: "If you like a rating, give it a heart. You can mark flowers and profiles the same way.",
    },
    link: "/reviews",
  },
  {
    id: "2026-10-14-kommentare",
    datum: "2026-10-14",
    art: "neu",
    titel: { de: "Kommentare unter Bewertungen", en: "Comments on ratings" },
    text: {
      de: "Du kannst jetzt unter jeder Bewertung mitreden. Unpassende Beiträge meldest du mit einem Klick.",
      en: "You can now join the conversation under every rating. Report unsuitable posts with one click.",
    },
    link: "/reviews",
  },
  {
    id: "2026-10-14-profil",
    datum: "2026-10-14",
    art: "besser",
    titel: { de: "Profil und Konto an einem Ort", en: "Profile and account in one place" },
    text: {
      de: "Ein Knopf, eine Seite: Dein Profil, deine Zahlen und deine Einstellungen liegen jetzt zusammen.",
      en: "One button, one page: your profile, your numbers and your settings are now together.",
    },
    link: "/profil",
  },
  {
    id: "2026-10-13-vertreiber",
    datum: "2026-10-13",
    art: "neu",
    titel: { de: "Vertreiber im Vergleich", en: "Compare distributors" },
    text: {
      de: "Gleiche Blüte, anderer Vertreiber: Auf der Blütenseite siehst du, wie die Community jeden Anbieter bewertet.",
      en: "Same flower, different distributor: on the flower page you see how the community rates each one.",
    },
    link: "/blueten",
  },
  {
    id: "2026-10-13-oeffentliches-profil",
    datum: "2026-10-13",
    art: "neu",
    titel: { de: "Profile anderer Mitglieder", en: "Other members' profiles" },
    text: {
      de: "Schau dir an, was andere bewertet haben und welche Aromen sie mögen. Alles übersichtlich in Reitern.",
      en: "See what others have rated and which aromas they like. Everything neatly arranged in tabs.",
    },
  },
  {
    id: "2026-10-09-aroma-netz",
    datum: "2026-10-09",
    art: "neu",
    titel: { de: "Aroma-Netz für Geschmack und Terpene", en: "Aroma web for taste and terpenes" },
    text: {
      de: "Das Aroma-Netz zeigt dein Profil wahlweise nach Geschmäckern oder nach zehn Terpenen. So siehst du, was dir schmeckt.",
      en: "The aroma web shows your profile by tastes or by ten terpenes. That way you see what you enjoy.",
    },
    link: "/profil",
  },
  {
    id: "2026-10-09-dein-kapitel",
    datum: "2026-10-09",
    art: "neu",
    titel: { de: "Dein Kapitel auf der Startseite", en: "Your Chapter on the home page" },
    text: {
      de: "Auf der Startseite steht jetzt dein eigenes Kapitel mit deinen Bewertungen und deinem Aroma-Netz.",
      en: "The home page now holds your own chapter with your ratings and your aroma web.",
    },
    link: "/",
  },
  {
    id: "2026-10-09-hersteller-filter",
    datum: "2026-10-09",
    art: "neu",
    titel: { de: "Katalog nach Hersteller filtern", en: "Filter the catalogue by producer" },
    text: {
      de: "Im Katalog filterst du jetzt nach Hersteller. Die Zahl daneben zeigt, wie viele Strains es jeweils gibt.",
      en: "You can now filter the catalogue by producer. The number next to it shows how many strains each has.",
    },
    link: "/blueten",
  },
  {
    id: "2026-09-25-aroma-karte",
    datum: "2026-09-25",
    art: "neu",
    titel: { de: "Bewerten mit der Aroma-Karte", en: "Rate with the aroma map" },
    text: {
      de: "Du ziehst die Geschmäcker direkt auf der Karte und siehst live, wie sich das Bild deiner Blüte formt.",
      en: "You drag the tastes straight on the map and watch the picture of your flower take shape live.",
    },
    link: "/reviews",
  },
  {
    id: "2026-09-25-book-of-terpz",
    datum: "2026-09-25",
    art: "neu",
    titel: { de: "Willkommen im Book of Terpz", en: "Welcome to Book of Terpz" },
    text: {
      de: "Unser neuer Name und ein neuer Look: Papier, Handschrift und Blattgrün. Bewertungen lesen sich jetzt wie ein Buch.",
      en: "Our new name and a new look: paper, handwriting and leaf green. Ratings now read like a book.",
    },
    link: "/",
  },
];

export const IN_ARBEIT: readonly InArbeit[] = [
  {
    id: "in-arbeit-terpene",
    titel: { de: "Mehr Wissen zu seltenen Terpenen", en: "More on rare terpenes" },
    text: {
      de: "Wir ergänzen weitere Terpene wie Valencen und Camphen, jeweils mit Quellen.",
      en: "We're adding more terpenes such as valencene and camphene, each with sources.",
    },
  },
  {
    id: "in-arbeit-blueten-daten",
    titel: { de: "Fehlende Blüten im Katalog", en: "Missing flowers in the catalogue" },
    text: {
      de: "Einige Blüten fehlen noch, weil Angaben fehlen. Wir tragen sie nach, sobald die Daten da sind.",
      en: "Some flowers are still missing because details are lacking. We add them once the data is in.",
    },
  },
];
