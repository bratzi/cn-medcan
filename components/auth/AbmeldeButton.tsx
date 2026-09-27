"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { Button } from "@/components/ui";
import type { Woerterbuch } from "@/lib/i18n/typen";

export function AbmeldeButton({ texte }: { texte: Woerterbuch["auth"]["formular"] }) {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);

  async function abmelden() {
    setLaeuft(true);
    await signOut();
    // Ohne refresh() behalten die Serverkomponenten die alte Sitzung im
    // Cache und zeigen weiter den angemeldeten Zustand.
    zaehlerZuruecksetzen();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variante="secondary" groesse="sm" onClick={abmelden} disabled={laeuft}>
      {laeuft ? texte.wirdAbgemeldet : texte.abmelden}
    </Button>
  );
}
