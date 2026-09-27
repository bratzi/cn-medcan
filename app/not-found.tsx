import Link from "next/link";

import { buttonKlassen } from "@/components/ui";
import { holeWoerterbuch } from "@/lib/i18n";

export default async function NotFound() {
  const w = await holeWoerterbuch();

  return (
    <div className="mx-auto w-full max-w-360 px-4 py-16 sm:px-8">
      <p className="numeric text-small text-text-muted">404</p>
      <h1 className="mt-2 text-h1 text-text">{w.fehlerseite.nichtGefunden}</h1>
      <p className="mt-4 max-w-[68ch] text-body text-text-muted">
        {w.fehlerseite.nichtGefundenSatz}
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/" className={buttonKlassen("primary", "md")}>
          {w.fehlerseite.zurStartseite}
        </Link>
        <Link href="/blueten" className={buttonKlassen("secondary", "md")}>
          {w.fehlerseite.zumKatalog}
        </Link>
      </div>
    </div>
  );
}
