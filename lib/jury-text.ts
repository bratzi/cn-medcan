export type Inline = { text: string; fett?: boolean; kursiv?: boolean };
export type Block = { art: "absatz" | "zwischentitel" | "liste"; teile: Inline[][] };

/** **fett** und *kursiv*; alles andere bleibt wörtlich Text (kein HTML, keine Links). */
function inline(zeile: string): Inline[] {
  const teile: Inline[] = [];
  const muster = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let rest = 0;
  for (const m of zeile.matchAll(muster)) {
    if (m.index! > rest) teile.push({ text: zeile.slice(rest, m.index) });
    teile.push(m[1] !== undefined ? { text: m[1], fett: true } : { text: m[2], kursiv: true });
    rest = m.index! + m[0].length;
  }
  if (rest < zeile.length) teile.push({ text: zeile.slice(rest) });
  return teile;
}

/** Markdown-Teilmenge der Jury-Texte: `## ` Zwischentitel, `- ` Liste, Leerzeile trennt Absätze. */
export function juryTextBloecke(md: string): Block[] {
  return md
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((roh) => roh.trim())
    .filter(Boolean)
    .map((roh): Block => {
      const zeilen = roh.split("\n");
      if (zeilen.length === 1 && zeilen[0].startsWith("## ")) return { art: "zwischentitel", teile: [inline(zeilen[0].slice(3))] };
      if (zeilen.every((z) => z.startsWith("- "))) return { art: "liste", teile: zeilen.map((z) => inline(z.slice(2))) };
      return { art: "absatz", teile: [inline(zeilen.join(" "))] };
    });
}
