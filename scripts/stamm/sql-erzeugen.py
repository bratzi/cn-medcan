"""
Erzeugt aus data/stamm/produktstamm.json ein wiederholbares SQL fuer D1
(Spec Redesign 19, eigener Produktstamm). Nur Entwicklungszeit.

    python scripts/stamm/sql-erzeugen.py

Schreibt data/stamm/import.sql. Die Ids entstehen deterministisch aus dem
Slug (uuid5), deshalb aktualisiert ein erneuter Lauf dieselben Zeilen statt
neue anzulegen. THC und CBD sind Pflicht: fehlt ein Wert, wird er aus dem
Handelsnamen gelesen ("22/1" = 22 % THC, 1 % CBD); geht auch das nicht,
faellt die Sorte heraus und steht in der Ausgabe. Nie 0 % erfinden.

Ausfuehren: lokal `npx wrangler d1 execute cn-medcan-db --local --file data/stamm/import.sql`,
live dasselbe mit --remote (macht der Nutzer selbst).
"""
import json
import re
import uuid

NS = uuid.UUID("6f1c2b8e-2d8a-4f4e-9a57-5b7c1e2d3a40")
QUELLE = "data/stamm/produktstamm.json"
ZIEL = "data/stamm/import.sql"

TYPEN = {"INDICA", "SATIVA", "HYBRID", "RUDERALIS"}
FORMEN = {"BLUETE", "EXTRAKT", "GRANULAT"}
BESTRAHLUNG = {"GAMMA", "E_BEAM", "UNBESTRAHLT", "UNBEKANNT"}

# Terpen -> Geschmacksachse (GESCHMACKS_KATEGORIEN) und kurzes Aromaprofil.
TERPENE = {
    "myrcen": ("Myrcen", "ERDIG", "erdig, moschusartig, reife Frucht"),
    "limonen": ("Limonen", "ZITRUS", "Zitrone, Orange"),
    "beta-caryophyllen": ("beta-Caryophyllen", "WUERZIG", "Pfeffer, Nelke"),
    "caryophyllen": ("beta-Caryophyllen", "WUERZIG", "Pfeffer, Nelke"),
    "linalool": ("Linalool", "BLUMIG", "Lavendel, blumig"),
    "alpha-pinen": ("alpha-Pinen", "HOLZIG", "Kiefer, Harz"),
    "pinen": ("alpha-Pinen", "HOLZIG", "Kiefer, Harz"),
    "beta-pinen": ("alpha-Pinen", "HOLZIG", "Kiefer, Harz"),
    "terpinolen": ("Terpinolen", "KRAEUTRIG", "kräutrig, blumig, frisch"),
    "humulen": ("Humulen", "HOLZIG", "Hopfen, holzig"),
    "alpha-humulen": ("Humulen", "HOLZIG", "Hopfen, holzig"),
    "ocimen": ("Ocimen", "SUESS", "süß, krautig"),
    "bisabolol": ("Bisabolol", "BLUMIG", "Kamille, mild"),
    "farnesen": ("Farnesen", "SUESS", "grüner Apfel"),
    "nerolidol": ("Nerolidol", "HOLZIG", "Holz, Rinde"),
}


def q(wert):
    if wert is None:
        return "NULL"
    if isinstance(wert, bool):
        return "1" if wert else "0"
    if isinstance(wert, (int, float)):
        return repr(float(wert))
    return "'" + str(wert).replace("'", "''") + "'"


def slug(text):
    t = text.lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def aus_name(name):
    treffer = re.search(r"(\d{1,2}(?:[.,]\d)?)\s*/\s*(<\s*1|\d{1,2}(?:[.,]\d)?)", name)
    if not treffer:
        # "Canopy KMI 28": eine Zahl am Ende zwischen 10 und 35 ist der THC-Gehalt.
        ende = re.search(r"\s(\d{2})$", name.strip())
        if ende and 10 <= int(ende.group(1)) <= 35:
            return float(ende.group(1)), None
        return None, None
    thc = float(treffer.group(1).replace(",", "."))
    cbd = 1.0 if "<" in treffer.group(2) else float(treffer.group(2).replace(",", "."))
    return thc, cbd


def firma(name, rolle, firmen):
    if not name or name.lower().startswith(("unbekannt", "nicht genannt")):
        return None
    key = re.sub(r"\s+(gmbh|pharma|pharmaceuticals|international)\b", "", name.lower()).strip()
    if key not in firmen:
        firmen[key] = {"id": str(uuid.uuid5(NS, "u:" + key)), "name": name.strip(), "rolle": rolle}
    elif firmen[key]["rolle"] != rolle:
        firmen[key]["rolle"] = "BEIDES"
    return firmen[key]["id"]


def main():
    produkte = json.load(open(QUELLE, encoding="utf8"))["produkte"]
    firmen, terpene, zeilen, raus, zuordnungen = {}, {}, [], [], []
    for p in produkte:
        name = p["handelsname"].strip()
        thc_max, cbd_max = p.get("thcMaxProzent"), p.get("cbdMaxProzent")
        n_thc, n_cbd = aus_name(name)
        thc_max = thc_max if thc_max is not None else n_thc
        cbd_max = cbd_max if cbd_max is not None else n_cbd
        if thc_max is None:
            raus.append(name)
            continue
        cbd_max = cbd_max if cbd_max is not None else 1.0
        thc_min = p.get("thcMinProzent") if p.get("thcMinProzent") is not None else thc_max
        cbd_min = p.get("cbdMinProzent") if p.get("cbdMinProzent") is not None else 0.0
        # Quellen widersprechen sich mitunter: eine Spanne ist immer min <= max.
        thc_min, thc_max = min(thc_min, thc_max), max(thc_min, thc_max)
        cbd_min, cbd_max = min(cbd_min, cbd_max), max(cbd_min, cbd_max)
        s = slug(name)
        sid = str(uuid.uuid5(NS, "s:" + s))
        typ = p.get("kultivarTyp") if p.get("kultivarTyp") in TYPEN else "HYBRID"
        form = p.get("darreichungsform") if p.get("darreichungsform") in FORMEN else "BLUETE"
        bestr = p.get("bestrahlung") if p.get("bestrahlung") in BESTRAHLUNG else "UNBEKANNT"
        hid = firma(p.get("hersteller"), "HERSTELLER", firmen)
        iid = firma(p.get("importeur"), "IMPORTEUR", firmen)
        such = " ".join(x for x in (name, p.get("kultivarName"), p.get("genetik")) if x).lower()
        zeilen.append(
            "INSERT INTO strains (id, slug, handelsname, pzn, darreichungsform, kultivar_name, kultivar_typ, genetik,"
            " thc_min_prozent, thc_max_prozent, cbd_min_prozent, cbd_max_prozent, bestrahlung, anbauland, suchtext,"
            " hersteller_id, importeur_id, aktiv, aktualisiert_am) VALUES ("
            + ", ".join(
                q(v)
                for v in (sid, s, name, p.get("pzn"), form, p.get("kultivarName"), typ, p.get("genetik"),
                          thc_min, thc_max, cbd_min, cbd_max, bestr, p.get("anbauland"), such, hid, iid)
            )
            + ", 1, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET handelsname=excluded.handelsname,"
            " pzn=excluded.pzn, darreichungsform=excluded.darreichungsform, kultivar_name=excluded.kultivar_name,"
            " kultivar_typ=excluded.kultivar_typ, genetik=excluded.genetik, thc_min_prozent=excluded.thc_min_prozent,"
            " thc_max_prozent=excluded.thc_max_prozent, cbd_min_prozent=excluded.cbd_min_prozent,"
            " cbd_max_prozent=excluded.cbd_max_prozent, bestrahlung=excluded.bestrahlung, anbauland=excluded.anbauland,"
            " suchtext=excluded.suchtext, hersteller_id=excluded.hersteller_id, importeur_id=excluded.importeur_id,"
            " aktualisiert_am=CURRENT_TIMESTAMP;"
        )
        rang = 0
        gesehen = set()
        for t in p.get("terpene") or []:
            info = TERPENE.get(str(t.get("name", "")).strip().lower())
            if not info or info[0] in gesehen:
                continue
            gesehen.add(info[0])
            rang += 1
            tid = str(uuid.uuid5(NS, "t:" + info[0]))
            terpene[tid] = info
            zuordnungen.append((sid, tid, t.get("konzentrationProzent"), rang))
        zuordnungen.append((sid, None, None, 0))  # Marker: Zuordnungen dieser Sorte neu schreiben

    aus = ["PRAGMA defer_foreign_keys = true;"]
    for f in firmen.values():
        aus.append(
            f"INSERT INTO unternehmen (id, name, rolle) VALUES ({q(f['id'])}, {q(f['name'])}, {q(f['rolle'])})"
            " ON CONFLICT(id) DO UPDATE SET name=excluded.name, rolle=excluded.rolle;"
        )
    for tid, (name, geschmack, aroma) in terpene.items():
        aus.append(
            f"INSERT INTO terpene (id, name, aroma_profil, geschmack) VALUES ({q(tid)}, {q(name)}, {q(aroma)}, {q(geschmack)})"
            " ON CONFLICT(name) DO UPDATE SET aroma_profil=excluded.aroma_profil, geschmack=excluded.geschmack;"
        )
    aus += zeilen
    for sid, tid, konz, rang in zuordnungen:
        if tid is None:
            continue
        aus.append(
            "INSERT INTO strain_terpene (strain_id, terpen_id, konzentration_prozent, rang) VALUES ("
            f"{q(sid)}, (SELECT id FROM terpene WHERE name = {q(terpene[tid][0])}), {q(konz)}, {rang})"
            " ON CONFLICT(strain_id, terpen_id) DO UPDATE SET konzentration_prozent=excluded.konzentration_prozent, rang=excluded.rang;"
        )
    open(ZIEL, "w", encoding="utf8", newline="\n").write("\n".join(aus) + "\n")
    print(f"{len(zeilen)} Sorten, {len(firmen)} Unternehmen, {len(terpene)} Terpene -> {ZIEL}")
    if raus:
        print(f"{len(raus)} ohne THC-Angabe ausgelassen:", "; ".join(raus[:20]), "…" if len(raus) > 20 else "")


if __name__ == "__main__":
    main()
