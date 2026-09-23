-- CreateTable
CREATE TABLE "unternehmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "land" TEXT,
    "rolle" TEXT NOT NULL,
    "gdp_nummer" TEXT,
    "website" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "terpene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "aroma_profil" TEXT NOT NULL,
    "geschmack" TEXT NOT NULL,
    "siedepunkt_c" REAL
);

-- CreateTable
CREATE TABLE "strains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "handelsname" TEXT NOT NULL,
    "pzn" TEXT,
    "darreichungsform" TEXT NOT NULL DEFAULT 'BLUETE',
    "kultivar_name" TEXT,
    "kultivar_typ" TEXT NOT NULL,
    "genetik" TEXT,
    "thc_min_prozent" REAL NOT NULL,
    "thc_max_prozent" REAL NOT NULL,
    "cbd_min_prozent" REAL NOT NULL,
    "cbd_max_prozent" REAL NOT NULL,
    "bestrahlung" TEXT NOT NULL DEFAULT 'UNBEKANNT',
    "anbauland" TEXT,
    "hersteller_bild_pfad" TEXT,
    "beschreibung" TEXT,
    "verschreibungspflichtig" BOOLEAN NOT NULL DEFAULT true,
    "bfarm_gelistet" BOOLEAN NOT NULL DEFAULT true,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "suchtext" TEXT NOT NULL,
    "hersteller_id" TEXT,
    "importeur_id" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "strains_hersteller_id_fkey" FOREIGN KEY ("hersteller_id") REFERENCES "unternehmen" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "strains_importeur_id_fkey" FOREIGN KEY ("importeur_id") REFERENCES "unternehmen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strain_terpene" (
    "strain_id" TEXT NOT NULL,
    "terpen_id" TEXT NOT NULL,
    "konzentration_prozent" REAL,
    "rang" INTEGER NOT NULL,

    PRIMARY KEY ("strain_id", "terpen_id"),
    CONSTRAINT "strain_terpene_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "strain_terpene_terpen_id_fkey" FOREIGN KEY ("terpen_id") REFERENCES "terpene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    "ort" TEXT NOT NULL,
    "strasse" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "website" TEXT,
    "versandapotheke" BOOLEAN NOT NULL DEFAULT true,
    "lieferzeit_tage_min" INTEGER NOT NULL,
    "lieferzeit_tage_max" INTEGER NOT NULL,
    "rezept_status" TEXT NOT NULL,
    "erezept_token_upload" BOOLEAN NOT NULL DEFAULT false,
    "betriebserlaubnis_nr" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pharmacy_stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacy_id" TEXT NOT NULL,
    "strain_id" TEXT NOT NULL,
    "packung_gramm" INTEGER NOT NULL,
    "preis_pro_gramm_cent" INTEGER,
    "bestand_gramm" REAL,
    "status" TEXT NOT NULL DEFAULT 'VERFUEGBAR',
    "nur_fuer_fachkreise" BOOLEAN NOT NULL DEFAULT true,
    "stand_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pharmacy_stock_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pharmacy_stock_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chargen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strain_id" TEXT NOT NULL,
    "chargen_nr" TEXT NOT NULL,
    "analysedatum" DATETIME,
    "thc_ist" REAL,
    "cbd_ist" REAL,
    "labor_bericht" TEXT,
    "verfallsdatum" DATETIME,
    CONSTRAINT "chargen_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strain_id" TEXT NOT NULL,
    "charge_id" TEXT,
    "autor_id" TEXT NOT NULL,
    "aussehen" INTEGER NOT NULL,
    "geruch" INTEGER NOT NULL,
    "geschmack" INTEGER NOT NULL,
    "wirkung" INTEGER NOT NULL,
    "konsistenz" INTEGER NOT NULL,
    "feuchtigkeit_prozent" REAL,
    "geschmacks_matrix" TEXT NOT NULL,
    "notiz" TEXT,
    "instagram_reel_url" TEXT,
    "freigegeben" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "reviews_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "chargen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "unternehmen_name_rolle_key" ON "unternehmen"("name", "rolle");

-- CreateIndex
CREATE UNIQUE INDEX "terpene_name_key" ON "terpene"("name");

-- CreateIndex
CREATE UNIQUE INDEX "strains_slug_key" ON "strains"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "strains_handelsname_key" ON "strains"("handelsname");

-- CreateIndex
CREATE INDEX "strains_kultivar_typ_idx" ON "strains"("kultivar_typ");

-- CreateIndex
CREATE INDEX "strains_thc_min_prozent_idx" ON "strains"("thc_min_prozent");

-- CreateIndex
CREATE INDEX "strains_darreichungsform_idx" ON "strains"("darreichungsform");

-- CreateIndex
CREATE INDEX "strains_aktiv_idx" ON "strains"("aktiv");

-- CreateIndex
CREATE INDEX "strains_suchtext_idx" ON "strains"("suchtext");

-- CreateIndex
CREATE INDEX "strain_terpene_terpen_id_idx" ON "strain_terpene"("terpen_id");

-- CreateIndex
CREATE UNIQUE INDEX "strain_terpene_strain_id_rang_key" ON "strain_terpene"("strain_id", "rang");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_slug_key" ON "pharmacies"("slug");

-- CreateIndex
CREATE INDEX "pharmacies_plz_idx" ON "pharmacies"("plz");

-- CreateIndex
CREATE INDEX "pharmacy_stock_strain_id_status_idx" ON "pharmacy_stock"("strain_id", "status");

-- CreateIndex
CREATE INDEX "pharmacy_stock_preis_pro_gramm_cent_idx" ON "pharmacy_stock"("preis_pro_gramm_cent");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_stock_pharmacy_id_strain_id_packung_gramm_key" ON "pharmacy_stock"("pharmacy_id", "strain_id", "packung_gramm");

-- CreateIndex
CREATE UNIQUE INDEX "chargen_strain_id_chargen_nr_key" ON "chargen"("strain_id", "chargen_nr");

-- CreateIndex
CREATE INDEX "reviews_strain_id_freigegeben_idx" ON "reviews"("strain_id", "freigegeben");

-- CreateIndex
CREATE INDEX "reviews_charge_id_idx" ON "reviews"("charge_id");

-- CreateIndex
CREATE INDEX "reviews_autor_id_idx" ON "reviews"("autor_id");

