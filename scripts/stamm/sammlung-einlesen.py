"""
Liest die Sortensammlung des Betreibers (1.json, Nutzer 2026-09-27, von Hand
zusammengetragen) in data/stamm/produktstamm.json ein. Nur Entwicklungszeit.

    python scripts/stamm/sammlung-einlesen.py [pfad/zu/1.json]

Regeln (Nutzerentscheid 2026-09-29):
- Sorten, die wir noch nicht haben, werden neu angelegt, soweit die Angaben
  reichen (Handelsname, Kultivar, Typ, Hersteller, Land, THC/CBD, Terpene
  als Rangfolge ohne Konzentration, Aromen).
- Vorhandene Sorten bekommen nur LEERE Felder gefüllt; nichts wird
  überschrieben, was aus eigener Recherche stammt.
- `effect` und `medicaleffect` werden nie gelesen: Wirk- und
  Indikationsangaben sind nach HWG tabu, auch nicht versteckt in den Daten.
- Jede berührte Sorte trägt die Quelle in `quellen`.

Danach `python scripts/stamm/sql-erzeugen.py` für data/stamm/import.sql.
"""
import importlib.util
import json
import re
import sys

STAMM = "data/stamm/produktstamm.json"
QUELLE_TEXT = "Sortensammlung des Betreibers (1.json, 2026-09)"

_spec = importlib.util.spec_from_file_location("sql_erzeugen", "scripts/stamm/sql-erzeugen.py")
_sql = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sql)
TERPENE = _sql.TERPENE  # bekannte Terpene: Schlüssel klein geschrieben

TYPEN = {"sativa": "SATIVA", "indica": "INDICA", "hybrid": "HYBRID"}
FIRMEN_FUELLWORTE = r"\b(gmbh|ag|pharma|pharmaceuticals|pharmaceutical|medical|germany|deutschland|canada|inc|ltd|co|kg|international|health|therapeutics|cannabis)\b"


def norm(text):
    t = (text or "").lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "", t)


def firma_norm(text):
    return norm(re.sub(FIRMEN_FUELLWORTE, " ", (text or "").lower()))


def gleiche_firma(a, b):
    x, y = firma_norm(a), firma_norm(b)
    return bool(x and y) and (x == y or x.startswith(y) or y.startswith(x))


def prozent(roh):
    """'22,0%' -> 22.0, '< 1,0%' -> 1.0 (Obergrenze, keine 0 erfinden), '-' -> None."""
    if roh is None:
        return None
    treffer = re.search(r"(\d+(?:[.,]\d+)?)", str(roh))
    return float(treffer.group(1).replace(",", ".")) if treffer else None


def terpen_name(roh):
    """Schreibweisen der Sammlung auf die bekannten Namen abbilden, sonst None."""
    t = str(roh).strip().lower().replace("β", "beta").replace("α", "alpha")
    t = t.replace("ocimem", "ocimen")
    kandidaten = [t]
    if t.endswith("ene"):
        kandidaten.append(t[:-1])
    for vorsatz in ("beta-", "alpha-", "beta ", "alpha "):
        if t.startswith(vorsatz):
            rest = t[len(vorsatz):]
            kandidaten += [rest, rest[:-1] if rest.endswith("ene") else rest]
    for k in kandidaten:
        if k in TERPENE:
            return TERPENE[k][0]
    return None


def terpene_aus(sorte):
    gesehen, liste = set(), []
    for roh in sorte.get("terpene") or []:
        name = terpen_name(roh)
        if name and name not in gesehen:
            gesehen.add(name)
            liste.append({"name": name, "konzentrationProzent": None})
    return liste


AROMA_SCHREIBWEISE = {"suess": "Süß", "wuerzig": "Würzig", "gebaeck": "Gebäck", "zitrus": "Citrus", "tropical": "Tropisch"}


def aromen_aus(sorte):
    """Groß geschrieben, Umlaute statt Umschreibung, ohne Dubletten."""
    liste = []
    for roh in sorte.get("aroma") or []:
        t = str(roh).strip()
        if not t:
            continue
        t = AROMA_SCHREIBWEISE.get(t.lower(), t[0].upper() + t[1:])
        if t not in liste:
            liste.append(t)
    return liste


def land(roh):
    t = (roh or "").strip()
    return None if t in ("", "-") else t


def passt(sorte, produkt):
    if norm(sorte.get("medicalname")) == norm(produkt["handelsname"]):
        return True
    if not gleiche_firma(sorte.get("producer"), produkt.get("hersteller")):
        return False
    if not produkt.get("kultivarName") or norm(sorte.get("culture")) != norm(produkt["kultivarName"]):
        return False
    thc_a, thc_b = prozent(sorte.get("thc")), produkt.get("thcMaxProzent")
    return thc_a is None or thc_b is None or abs(thc_a - thc_b) <= 2


def quelle_vermerken(produkt):
    quellen = produkt.setdefault("quellen", [])
    if QUELLE_TEXT not in quellen:
        quellen.append(QUELLE_TEXT)


def main():
    pfad = sys.argv[1] if len(sys.argv) > 1 else "1.json"
    sammlung = json.load(open(pfad, encoding="utf8"))["Strains"]
    stamm = json.load(open(STAMM, encoding="utf8"))
    produkte = stamm["produkte"]
    namen = {norm(p["handelsname"]) for p in produkte}

    ergaenzt, neu, doppelt, ohne_name = 0, 0, 0, 0
    for sorte in sammlung:
        handelsname = (sorte.get("medicalname") or "").strip()
        if not handelsname:
            ohne_name += 1
            continue
        treffer = [p for p in produkte if passt(sorte, p)]
        if len(treffer) == 1:
            p = treffer[0]
            vorher = json.dumps(p, sort_keys=True)
            if not p.get("kultivarName") and sorte.get("culture"):
                p["kultivarName"] = sorte["culture"].strip()
            if not p.get("anbauland") and land(sorte.get("origin")):
                p["anbauland"] = land(sorte["origin"])
            if p.get("thcMaxProzent") is None and prozent(sorte.get("thc")) is not None:
                p["thcMaxProzent"] = prozent(sorte["thc"])
            if p.get("cbdMaxProzent") is None and prozent(sorte.get("cbd")) is not None:
                p["cbdMaxProzent"] = prozent(sorte["cbd"])
            if not p.get("terpene") and terpene_aus(sorte):
                p["terpene"] = terpene_aus(sorte)
            if not p.get("aromen") and aromen_aus(sorte):
                p["aromen"] = aromen_aus(sorte)
            if json.dumps(p, sort_keys=True) != vorher:
                quelle_vermerken(p)
                ergaenzt += 1
            continue
        if treffer or norm(handelsname) in namen:
            # Mehrdeutig oder Name schon vorhanden: nicht raten, nicht doppelt anlegen.
            doppelt += 1
            continue
        hersteller = (sorte.get("producer") or "").strip() or None
        if hersteller and "bfarm" in hersteller.lower():
            hersteller = None  # das BfArM vertreibt, stellt aber nicht her
        produkte.append(
            {
                "handelsname": handelsname,
                "hersteller": hersteller,
                "importeur": None,
                "kultivarName": (sorte.get("culture") or "").strip() or None,
                "genetik": None,
                "kultivarTyp": TYPEN.get(str(sorte.get("type") or "").strip().lower(), "HYBRID"),
                "dominanz": None,
                "darreichungsform": "BLUETE",
                "thcMinProzent": None,
                "thcMaxProzent": prozent(sorte.get("thc")),
                "cbdMinProzent": None,
                "cbdMaxProzent": prozent(sorte.get("cbd")),
                "bestrahlung": "UNBEKANNT",
                "anbauland": land(sorte.get("origin")),
                "terpene": terpene_aus(sorte),
                "aromen": aromen_aus(sorte),
                "pzn": None,
                "quellen": [QUELLE_TEXT],
            }
        )
        namen.add(norm(handelsname))
        neu += 1

    stamm["anzahl"] = len(produkte)
    stamm["methode"] = stamm.get("methode", "").rstrip() + (
        "" if QUELLE_TEXT in stamm.get("methode", "") else
        f" Runde 3 (2026-09-29): {QUELLE_TEXT}; neue Sorten angelegt, vorhandene nur in leeren Feldern ergänzt,"
        " Wirk- und Indikationsangaben nicht übernommen (HWG)."
    )
    with open(STAMM, "w", encoding="utf8", newline="\r\n") as datei:  # Datei liegt in CRLF vor
        json.dump(stamm, datei, ensure_ascii=False, indent=2)
        datei.write("\n")
    print(f"{len(sammlung)} Sorten gelesen: {neu} neu, {ergaenzt} ergänzt, {doppelt} mehrdeutig/vorhanden übersprungen,"
          f" {ohne_name} ohne Namen. Stamm jetzt {len(produkte)}.")


if __name__ == "__main__":
    main()
