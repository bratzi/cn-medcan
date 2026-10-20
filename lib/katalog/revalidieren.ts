import { revalidateTag } from "next/cache";

/** Nach Änderungen an Strains, Kennwerten oder Reviews: Katalog und Filter-Facetten neu bauen. */
export function revalidiereKatalog(): void {
  revalidateTag("katalog", "max");
  revalidateTag("facetten", "max");
}
