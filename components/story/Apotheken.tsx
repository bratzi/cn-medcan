import Link from "next/link";

import { buttonKlassen } from "@/components/ui";

/** Sektion 8 (Spec 5.1): ein Satz und ein Link. */
export function Apotheken() {
  return (
    <section aria-labelledby="apotheken-titel" className="relative isolate overflow-x-clip px-4 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto flex w-full max-w-360 flex-col items-start gap-6 border-t border-border pt-12">
        <h2 id="apotheken-titel" className="font-buch text-kapitel text-text">
          <em className="farbverlauf italic">Apotheken</em>
        </h2>
        <p className="max-w-[56ch] text-body text-text-muted text-pretty">
          Zu jeder gelisteten Versandapotheke stehen Standort, Lieferzeit, akzeptierte Rezeptarten
          und das gemeldete Sortiment.
        </p>
        <Link href="/apotheken" className={buttonKlassen("secondary", "md")}>
          Apotheken ansehen
        </Link>
      </div>
    </section>
  );
}
