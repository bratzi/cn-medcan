import { EigeneBeitraege } from "@/components/jury/EigeneBeitraege";
import { Feld } from "@/components/kapitel/Feld";
import { t } from "@/lib/i18n/text";

import { juryBeitraegeLaden, juryBewertungenLaden, textLaden } from "./laden";
import { SPALTEN } from "./spalten";

/** Bereich „Jury“ im Profil (Spec 2026-10-16), nur für Mitglieder mit Jury-Flag; `offen` kommt aus ?jury=. */
export async function ReiheJury({ id, offen, frischGespeichert, eingereicht }: { id: string; offen: string | null; frischGespeichert: boolean; eingereicht: boolean }) {
  const [{ w }, beitraege, bewertungen] = await Promise.all([textLaden(), juryBeitraegeLaden(id), juryBewertungenLaden(id)]);
  const texte = w.profil.jury;
  return (
    <Feld id="jury" rahmen="karte" groesse="klein" titel="Jury" kopf={texte.kopf} ton="lila" className={SPALTEN[12]}>
      {beitraege === null ? (
        <p className="max-w-[68ch] text-body text-text">{w.profil.fehler}</p>
      ) : (
        <EigeneBeitraege
          beitraege={beitraege}
          bewertungen={(bewertungen ?? []).map((b) => ({
            id: b.id,
            label: b.vertreiber ? t(texte.bewertungLabel, { sorte: b.sorte, vertreiber: b.vertreiber }) : b.sorte,
          }))}
          offen={offen}
          frischGespeichert={frischGespeichert}
          eingereicht={eingereicht}
          texte={texte}
          bildTexte={w.admin.jury}
        />
      )}
    </Feld>
  );
}
