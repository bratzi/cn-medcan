-- 0011_avatar
--
-- Profilbild der Mitglieder (T8, Nutzer 2026-09-29): 128 x 128 WebP, hoechstens
-- 30 KB, als BLOB in D1 (kein R2, nie kostenpflichtig). Ein Bild je Mitglied;
-- die id wechselt bei jedem neuen Upload, deshalb darf /api/bild/<id> ein Jahr
-- unveraenderlich gecacht werden. Nur eine neue Tabelle, kein Umbau.
--
-- D1: eine Zeile darf hoechstens 2 MB haben, ein BLOB ist ein gebundener
-- Parameter; 30 KB liegen weit darunter.

-- CreateTable
CREATE TABLE "nutzer_avatar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitglied_id" TEXT NOT NULL,
    "bild" BLOB NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nutzer_avatar_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "nutzer_avatar_mitglied_id_key" ON "nutzer_avatar"("mitglied_id");
