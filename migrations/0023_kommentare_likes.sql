-- 0023_kommentare_likes
--
-- Likes, Kommentare, Meldungen und vorberechnete Zaehler (Spec 2026-10-14).
-- Likes auf Bewertung, Bluete oder Mitglied (= folgen); Kommentare unter Bewertungen
-- und auf Profil-Pinnwaenden. Polymorphe Ziele ohne Fremdschluessel. Zaehler sind
-- vorberechnet (CPU-Limit 10 ms). Rein additiv: alter Code laeuft weiter.

-- CreateTable
CREATE TABLE "likes" (
    "mitglied_id" TEXT NOT NULL,
    "ziel_art" TEXT NOT NULL,
    "ziel_id" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("mitglied_id", "ziel_art", "ziel_id"),
    CONSTRAINT "likes_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kommentare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "autor_id" TEXT NOT NULL,
    "ziel_art" TEXT NOT NULL,
    "ziel_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SICHTBAR',
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kommentare_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kommentar_meldungen" (
    "kommentar_id" TEXT NOT NULL,
    "mitglied_id" TEXT NOT NULL,
    "grund" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("kommentar_id", "mitglied_id"),
    CONSTRAINT "kommentar_meldungen_kommentar_id_fkey" FOREIGN KEY ("kommentar_id") REFERENCES "kommentare" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "kommentar_meldungen_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "zaehler" (
    "ziel_art" TEXT NOT NULL,
    "ziel_id" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "kommentare" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("ziel_art", "ziel_id")
);

-- CreateIndex
CREATE INDEX "likes_ziel_idx" ON "likes"("ziel_art", "ziel_id");

-- CreateIndex
CREATE INDEX "likes_mitglied_idx" ON "likes"("mitglied_id", "ziel_art");

-- CreateIndex
CREATE INDEX "kommentare_ziel_idx" ON "kommentare"("ziel_art", "ziel_id", "status", "erstellt_am");

-- CreateIndex
CREATE INDEX "kommentare_autor_idx" ON "kommentare"("autor_id");
