/** Sektion 8: seit 2026-09-25 nur ein Ausblick (Nutzer: keine Apotheken- und Preisdaten verfügbar). */
export function Apotheken() {
  return (
    <section aria-labelledby="apotheken-titel" className="relative isolate overflow-x-clip px-4 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto flex w-full max-w-360 flex-col items-start gap-6 border-t border-border pt-12">
        <h2 id="apotheken-titel" className="font-buch text-kapitel text-text">
          <em className="farbverlauf hand-betont">Apotheken</em>
        </h2>
        <p className="text-small uppercase tracking-gesperrt text-text-muted">In Aussicht</p>
        <p className="max-w-[56ch] text-body text-text-muted text-pretty">
          Apotheken, Bestände und Preise kommen später dazu, sobald es dafür verlässliche Daten gibt. Bis dahin
          geht es hier um das, was zählt: Sorten gemeinsam bewerten.
        </p>
      </div>
    </section>
  );
}
