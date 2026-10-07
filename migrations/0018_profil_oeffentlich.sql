-- 0018_profil_oeffentlich
--
-- Profil Stufe 2 (Spec 2026-10-07, Abschnitt 9): oeffentliches Profil als Opt-in,
-- Vorgabe aus (Art. 9 DSGVO). Die Kurz-Id entsteht beim ersten Einschalten und
-- bleibt beim Ausschalten erhalten. Rein additiv: alter Code laeuft weiter.

-- AlterTable
ALTER TABLE "mitglied" ADD COLUMN "profil_oeffentlich" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mitglied" ADD COLUMN "kurz_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mitglied_kurz_id_key" ON "mitglied"("kurz_id");
