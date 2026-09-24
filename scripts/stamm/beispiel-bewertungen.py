"""
Fiktive Beispielbewertungen fuer die Live-Vorschau (Nutzerentscheidung
2026-09-25): damit Aroma-Karte, Sweet Spot und neuester Eintrag sichtbar
werden, bevor echte Bewertungen da sind. Jede Notiz sagt, dass sie fiktiv
ist. Ids deterministisch (uuid5): ein erneuter Lauf ersetzt dieselben Zeilen.

    python scripts/stamm/beispiel-bewertungen.py

Schreibt data/stamm/beispiel-bewertungen.sql. Entfernen:
DELETE FROM reviews WHERE notiz LIKE 'Fiktive Beispielbewertung%';
"""
import json
import random
import re
import uuid

NS = uuid.UUID("6f1c2b8e-2d8a-4f4e-9a57-5b7c1e2d3a40")
ACHSEN = ["diesel", "zitrus", "erdig", "suess", "wuerzig", "blumig", "holzig", "kraeutrig"]
TERPEN_ACHSE = {
    "myrcen": "erdig", "limonen": "zitrus", "beta-caryophyllen": "wuerzig", "caryophyllen": "wuerzig",
    "linalool": "blumig", "alpha-pinen": "holzig", "pinen": "holzig", "terpinolen": "kraeutrig",
    "humulen": "holzig", "ocimen": "suess", "bisabolol": "blumig",
}
TERPEN_NAME = {
    "myrcen": "Myrcen", "limonen": "Limonen", "beta-caryophyllen": "beta-Caryophyllen",
    "caryophyllen": "beta-Caryophyllen", "linalool": "Linalool", "alpha-pinen": "alpha-Pinen",
    "pinen": "alpha-Pinen", "terpinolen": "Terpinolen", "humulen": "Humulen", "ocimen": "Ocimen",
    "bisabolol": "Bisabolol",
}
NOTIZEN = [
    "Dichte, gut getrimmte Blüten. Beim Öffnen sofort deutlich im Aroma, im Nachgeschmack weicher.",
    "Aroma kräftiger als erwartet, die Restfeuchte passt. Konsistenz griffig, nicht staubig.",
    "Solide Charge. Das dominante Terpen trägt, der Rest bleibt im Hintergrund.",
    "Etwas trockener als ideal, im Geschmack aber klar und sauber.",
]


def slug(text):
    t = text.lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    zufall = random.Random(42)
    produkte = json.load(open("data/stamm/produktstamm.json", encoding="utf8"))["produkte"]
    kandidaten = []
    for p in produkte:
        namen = [str(t.get("name", "")).lower() for t in p.get("terpene") or []]
        bekannt = [n for n in namen if n in TERPEN_ACHSE]
        if len(bekannt) >= 2 and p.get("thcMaxProzent"):
            kandidaten.append((p, bekannt))
    auswahl = kandidaten[:: max(1, len(kandidaten) // 8)][:8]
    zeilen = ["PRAGMA defer_foreign_keys = true;"]
    for i, (p, terpene) in enumerate(auswahl):
        sid = str(uuid.uuid5(NS, "s:" + slug(p["handelsname"])))
        for j in range(3 if i < 4 else 2):
            basis = {a: 0.0 for a in ACHSEN}
            for rang, t in enumerate(terpene, start=1):
                basis[TERPEN_ACHSE[t]] = max(basis[TERPEN_ACHSE[t]], 5.0 - (rang - 1) * 1.5)
            matrix = {a: max(0.0, min(5.0, round((v + zufall.uniform(-1.2, 1.0)) * 2) / 2)) for a, v in basis.items()}
            for a in ACHSEN:
                if matrix[a] == 0 and zufall.random() < 0.3:
                    matrix[a] = 0.5 * zufall.randint(1, 3)
            intens = {TERPEN_NAME[t]: zufall.choice([2, 3, 3, 3, 4]) for t in terpene}
            noten = [zufall.choice([3, 4, 4, 5]) for _ in range(5)]
            redaktionell = 1 if (i == 0 and j == 0) else 0
            rid = str(uuid.uuid5(NS, f"r:{sid}:{j}"))
            notiz = "Fiktive Beispielbewertung: " + zufall.choice(NOTIZEN)
            zeilen.append(
                "INSERT INTO reviews (id, strain_id, ist_redaktionell, aussehen, geruch, geschmack, wirkung, konsistenz,"
                " feuchtigkeit_prozent, geschmacks_matrix, terpen_intensitaet, notiz, freigegeben, erstellt_am, aktualisiert_am)"
                f" VALUES ({q(rid)}, {q(sid)}, {redaktionell}, {', '.join(map(str, noten))},"
                f" {round(zufall.uniform(8.5, 12.5), 1)}, {q(json.dumps(matrix))}, {q(json.dumps(intens, ensure_ascii=False))},"
                f" {q(notiz)}, 1, datetime('now', '-{i * 3 + j} days'), CURRENT_TIMESTAMP)"
                " ON CONFLICT(id) DO UPDATE SET geschmacks_matrix=excluded.geschmacks_matrix,"
                " terpen_intensitaet=excluded.terpen_intensitaet, notiz=excluded.notiz, aktualisiert_am=CURRENT_TIMESTAMP;"
            )
    open("data/stamm/beispiel-bewertungen.sql", "w", encoding="utf8", newline="\n").write("\n".join(zeilen) + "\n")
    print(len(zeilen) - 1, "Bewertungen fuer", len(auswahl), "Sorten:", "; ".join(p["handelsname"] for p, _ in auswahl))


if __name__ == "__main__":
    main()
