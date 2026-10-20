import { revalidateTag } from "next/cache";

import { bauOeffentlichenKatalogNeu } from "@/lib/katalog/laden";

/**
 * Nach Änderungen an Strains, Kennwerten oder Reviews: Katalog und Filter-Facetten neu bauen und den
 * öffentlichen Katalog-Text in KV ersetzen (ein KV-Schreibvorgang je Änderung).
 */
export async function revalidiereKatalog(): Promise<void> {
  revalidateTag("katalog", "max");
  revalidateTag("facetten", "max");
  await bauOeffentlichenKatalogNeu();
}
