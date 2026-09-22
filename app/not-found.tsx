import Link from "next/link";

import { buttonKlassen } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-360 px-4 py-16 sm:px-8">
      <p className="numeric text-small text-text-muted">404</p>
      <h1 className="mt-2 text-h1 text-text">Seite nicht gefunden</h1>
      <p className="mt-4 max-w-[68ch] text-body text-text-muted">
        Die aufgerufene Adresse existiert nicht oder der Eintrag wurde aus dem
        Katalog entfernt.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/" className={buttonKlassen("primary", "md")}>
          Zur Startseite
        </Link>
        <Link href="/produkte" className={buttonKlassen("secondary", "md")}>
          Zum Produktkatalog
        </Link>
      </div>
    </div>
  );
}
