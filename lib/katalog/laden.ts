import { unstable_cache } from "next/cache";

import { getPrisma } from "@/lib/prisma";

/**
 * Baut das Katalog-JSON in D1 (json_group_array), damit der Worker nur Text durchreicht: der Neubau
 * muss unter 10 ms Worker-CPU bleiben (Free-Plan, edge-stack-master 1). Verschachtelte Arrays mit
 * json(...) umhüllen, sonst landen sie als String im Ergebnis.
 */
export function KATALOG_SQL_WAREN(fachkreis: boolean): string {
  const gate = fachkreis ? "" : " AND ps.nur_fuer_fachkreise = 0";
  return `SELECT json_group_array(json_object(
    'i', s.id, 's', s.slug, 'h', s.handelsname, 'k', s.kultivar_id, 'y', s.kultivar_typ,
    'f', s.darreichungsform, 'g', s.genetik, 't0', s.thc_min_prozent, 't1', s.thc_max_prozent,
    'c0', s.cbd_min_prozent, 'c1', s.cbd_max_prozent, 'v', s.vertreiber_id, 'b', s.hersteller_bild_pfad,
    'tp', json((SELECT json_group_array(te.name) FROM (SELECT st.terpen_id, st.rang FROM strain_terpene st
           WHERE st.strain_id = s.id AND st.rang <= 3 ORDER BY st.rang) r JOIN terpene te ON te.id = r.terpen_id)),
    'st', json((SELECT json_group_array(json_object('a', ph.slug, 's', ps.status, 'p', ps.preis_pro_gramm_cent))
           FROM pharmacy_stock ps JOIN pharmacies ph ON ph.id = ps.pharmacy_id
           WHERE ps.strain_id = s.id${gate})),
    'u', s.aktualisiert_am
  )) AS j FROM strains s WHERE s.aktiv = 1`;
}

// Nur freigegebene Bewertungen zählen öffentlich (Review.freigegeben).
const SQL_KULTIVARE = `SELECT json_group_array(json_object(
  'i', k.id, 'n', k.name, 's', k.slug,
  'cn', CASE WHEN kk.anzahl > 0 THEN kk.gesamtnote_mittel END, 'ca', COALESCE(kk.anzahl, 0),
  'en', (SELECT avg(r.gesamtnote) FROM reviews r WHERE r.kultivar_id = k.id AND r.ist_redaktionell = 1 AND r.freigegeben = 1 AND r.gesamtnote IS NOT NULL),
  'lb', (SELECT max(r.erstellt_am) FROM reviews r WHERE r.kultivar_id = k.id AND r.freigegeben = 1)
)) AS j FROM kultivare k LEFT JOIN kultivar_kennwerte kk ON kk.kultivar_id = k.id
WHERE EXISTS (SELECT 1 FROM strains s WHERE s.kultivar_id = k.id AND s.aktiv = 1)`;

const SQL_VERTREIBER = `SELECT json_group_array(json_object('i', u.id, 'n', u.name)) AS j FROM unternehmen u
WHERE EXISTS (SELECT 1 FROM strains s WHERE s.vertreiber_id = u.id AND s.aktiv = 1)`;
const SQL_TERPENE = `SELECT json_group_array(json_object('n', name, 'g', geschmack)) AS j FROM terpene`;
const SQL_APOTHEKEN = `SELECT json_group_array(json_object('s', slug, 'n', name)) AS j FROM pharmacies`;

async function baueKatalog(fachkreis: boolean): Promise<string> {
  const prisma = await getPrisma();
  const lies = async (sql: string) => (await prisma.$queryRawUnsafe<{ j: string }[]>(sql))[0]?.j ?? "[]";
  const [waren, kultivare, vertreiber, terpene, apotheken] = await Promise.all([
    lies(KATALOG_SQL_WAREN(fachkreis)), lies(SQL_KULTIVARE), lies(SQL_VERTREIBER), lies(SQL_TERPENE),
    fachkreis ? lies(SQL_APOTHEKEN) : Promise.resolve("[]"),
  ]);
  // Zusammensetzen per Text, nicht per JSON.parse/stringify: spart die CPU des Neubaus.
  return `{"stand":${JSON.stringify(new Date().toISOString())},"fachkreis":${fachkreis},"waren":${waren},"kultivare":${kultivare},"vertreiber":${vertreiber},"terpene":${terpene},"apotheken":${apotheken}}`;
}

const katalogGecacht = unstable_cache(baueKatalog, ["katalog-v1"], { revalidate: 3600, tags: ["katalog"] });

export function ladeKatalog(fachkreis: boolean): Promise<string> {
  return katalogGecacht(fachkreis);
}
