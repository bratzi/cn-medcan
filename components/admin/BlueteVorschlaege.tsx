import { BlueteFreigabe } from "@/components/admin/BlueteFreigabe";
import { Badge, Card, CardBody, CardHeader, EmptyState, textLinkKlassen } from "@/components/ui";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import { offeneVorschlaegeFuerAdmin, terpenNamen } from "@/lib/query/vorschlaege";
import { freigabeVorbelegen, quelleAlsLink, vorschlaegeBuendeln } from "@/lib/vorschlag-eingabe";

const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

/** Offene Bluetenvorschlaege, gleiche gebuendelt, aelteste zuerst (Spec 4.2). */
export async function BlueteVorschlaege() {
  const [offene, terpene, strains] = await Promise.all([
    offeneVorschlaegeFuerAdmin(),
    terpenNamen(),
    ladeStrainAuswahl(),
  ]);
  const gruppen = vorschlaegeBuendeln(offene);
  const katalog = strains.map((s) => ({ wert: s.id, label: s.handelsname }));

  return (
    <section aria-labelledby="vorschlaege-titel">
      <Card>
        <CardHeader>
          <h2 id="vorschlaege-titel" className="text-h3 text-text">
            Vorgeschlagene Blüten
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-8">
          {gruppen.length === 0 ? (
            <EmptyState titel="Keine offenen Vorschläge" beschreibung="Neue Vorschläge der Mitglieder erscheinen hier." />
          ) : (
            gruppen.map((gruppe) => (
              <article key={gruppe.schluessel} className="flex flex-col gap-6 border-t border-border pt-8 first:border-t-0 first:pt-0">
                <header className="flex flex-wrap items-center gap-4">
                  <h3 className="text-h3 text-text wrap-break-word">{gruppe.vorschlaege[0].handelsname}</h3>
                  <Badge variante="accent">
                    {gruppe.vorschlaege.length === 1 ? "1 Vorschlag" : `${gruppe.vorschlaege.length} Vorschläge`}
                  </Badge>
                </header>
                <ul className="flex flex-col gap-4">
                  {gruppe.vorschlaege.map((v) => {
                    const link = quelleAlsLink(v.quelle);
                    return (
                      <li key={v.id} className="text-small text-text">
                        <span className="font-medium">{v.anzeigename}</span>
                        <span className="text-text-muted">, {DATUM.format(v.erstelltAm)}. Quelle: </span>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer nofollow" className={textLinkKlassen()}>
                            {v.quelle}
                          </a>
                        ) : (
                          <span>{v.quelle}</span>
                        )}
                        {v.notiz ? <span className="block text-text-muted">{v.notiz}</span> : null}
                      </li>
                    );
                  })}
                </ul>
                <BlueteFreigabe
                  schluessel={gruppe.schluessel}
                  vorbelegung={freigabeVorbelegen(gruppe)}
                  terpene={terpene}
                  katalog={katalog}
                />
              </article>
            ))
          )}
        </CardBody>
      </Card>
    </section>
  );
}
