import { ladeEigeneBewertung } from "@/lib/query/strains";
import { ladeLiveNetzBasis } from "@/lib/query/profil";
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { ichStrain } from "@/lib/ich-strain";
import { aktuellesMitglied } from "@/lib/session";

export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9-]{1,64}$/;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const kultivarId = q.get("kultivar") ?? "";
  const strainId = q.get("strain") ?? "";
  const vertreiber = q.get("vertreiber");
  if (!ID.test(kultivarId) || !ID.test(strainId) || (vertreiber && !ID.test(vertreiber))) {
    return Response.json({ fehler: "parameter" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  const daten = await ichStrain(
    { mitglied: aktuellesMitglied, ladeEigeneBewertung, ladeLiveNetzBasis, vorbelegungAus: vorbelegungAus as never },
    { kultivarId, vertreiberId: vertreiber || null, strainId },
  );
  return Response.json(daten, { headers: { "Cache-Control": "private, no-store" } });
}
