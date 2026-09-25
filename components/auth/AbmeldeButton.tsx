"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { zaehlerZuruecksetzen } from "@/components/layout/konto-zaehler-speicher";
import { Button } from "@/components/ui";

export function AbmeldeButton() {
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
      {laeuft ? "Wird abgemeldet …" : "Abmelden"}
    </Button>
  );
}
