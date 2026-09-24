/**
 * Baut einen ICO-Container aus fertigen PNG-Bildern (Spec TP3 6). Einträge
 * mit PNG-Daten verstehen alle Browser; eine Bibliothek dafür wäre ein neues
 * Paket (Memory netzwerk-schonen). Nur Entwicklungszeit.
 */
export type IcoBild = { kante: number; png: Buffer };

const KOPF = 6;
const EINTRAG = 16;

export function icoAusPngs(bilder: readonly IcoBild[]): Buffer {
  const verzeichnis = Buffer.alloc(KOPF + EINTRAG * bilder.length);
  verzeichnis.writeUInt16LE(0, 0);
  verzeichnis.writeUInt16LE(1, 2);
  verzeichnis.writeUInt16LE(bilder.length, 4);

  let versatz = verzeichnis.length;
  bilder.forEach(({ kante, png }, index) => {
    if (!Number.isInteger(kante) || kante < 1 || kante > 256) {
      throw new Error(`ICO: Kante ${kante} liegt nicht zwischen 1 und 256`);
    }
    const stelle = KOPF + EINTRAG * index;
    // 256 steht im Verzeichnis als 0 (ein Byte).
    verzeichnis.writeUInt8(kante === 256 ? 0 : kante, stelle);
    verzeichnis.writeUInt8(kante === 256 ? 0 : kante, stelle + 1);
    verzeichnis.writeUInt8(0, stelle + 2);
    verzeichnis.writeUInt8(0, stelle + 3);
    verzeichnis.writeUInt16LE(1, stelle + 4);
    verzeichnis.writeUInt16LE(32, stelle + 6);
    verzeichnis.writeUInt32LE(png.length, stelle + 8);
    verzeichnis.writeUInt32LE(versatz, stelle + 12);
    versatz += png.length;
  });

  return Buffer.concat([verzeichnis, ...bilder.map((bild) => bild.png)]);
}
