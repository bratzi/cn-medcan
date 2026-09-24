"""
Freisteller-Pipeline (Spec Redesign 3), nur Entwicklungszeit.

    python scripts/medien/freistellen.py <pexelsId> <datei>

Laedt das Original einmal von Pexels (2400 px), stellt es mit rembg
(isnet-general-use) frei, setzt es in Graustufen mit Alpha, schneidet auf das
Motiv zu und schreibt WebP in 640/1280/1920 nach public/medien. Gibt Masse,
Urheber und Quelle fuer lib/medien.ts aus. Keine Wiederholung bei Fehlern.
"""
import io, json, os, sys, urllib.request
from PIL import Image, ImageOps
from rembg import new_session, remove

def key():
    for zeile in open(".env.local", encoding="utf8"):
        if zeile.startswith("PEXELS_API_KEY="):
            return zeile.split("=", 1)[1].strip().strip('"')
    sys.exit("PEXELS_API_KEY fehlt")

def hole(url, k=None):
    anfrage = urllib.request.Request(url, headers={"Authorization": k, "User-Agent": "cn-medcan"} if k else {"User-Agent": "cn-medcan"})
    with urllib.request.urlopen(anfrage, timeout=60) as antwort:
        return antwort.read()

pid, datei = sys.argv[1], sys.argv[2]
k = key()
foto = json.loads(hole(f"https://api.pexels.com/v1/photos/{pid}", k))
original = Image.open(io.BytesIO(hole(foto["src"]["original"] + "?auto=compress&cs=tinysrgb&w=2400")))
original = ImageOps.exif_transpose(original).convert("RGB")
frei = remove(original, session=new_session("isnet-general-use"))
alpha = frei.split()[-1]
grau = ImageOps.autocontrast(ImageOps.grayscale(original), cutoff=1)
bild = Image.merge("LA", (grau, alpha))
box = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
rand = int(max(bild.size) * 0.02)
bild = bild.crop((max(0, box[0] - rand), max(0, box[1] - rand), min(bild.width, box[2] + rand), min(bild.height, box[3] + rand)))
ziel = os.path.join("public", "medien")
for breite in (640, 1280, 1920):
    if breite > bild.width and breite != 640:
        continue
    fassung = bild if bild.width <= breite else bild.resize((breite, round(bild.height * breite / bild.width)), Image.LANCZOS)
    pfad = os.path.join(ziel, f"{datei}-{breite}.webp")
    fassung.convert("RGBA").save(pfad, "WEBP", quality=78, method=6)
    print(pfad, os.path.getsize(pfad) // 1024, "KB")
print(json.dumps({"pexelsId": int(pid), "breite": bild.width, "hoehe": bild.height, "urheber": foto["photographer"], "quelle": foto["url"], "alt": foto.get("alt", "")}, ensure_ascii=False))
