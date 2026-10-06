-- 0016_bewertungsbilder
--
-- Bilder zur Bewertung (Spec 2026-10-06): ein Budpic kann zu einer Bewertung
-- gehoeren. Kein neues Bildlager: dieselbe Tabelle, dieselbe Freigabe, dieselbe
-- Route. Ein Bild ohne review_id ist ein freies Budpic wie bisher.
--
-- SQLite erlaubt ADD COLUMN mit REFERENCES, wenn der Standardwert NULL ist.
-- Wird die Bewertung geloescht (Verwerfen in /admin), gehen ihre Bilder mit.

-- AlterTable
ALTER TABLE "budpics" ADD COLUMN "review_id" TEXT
  REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "budpics_review_id_status_idx" ON "budpics"("review_id", "status");
