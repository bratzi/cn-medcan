import { BlueteFreigabe } from "@/components/admin/BlueteFreigabe";
import { Avatar, Badge, Card, CardBody, CardHeader, EmptyState, textLinkKlassen } from "@/components/ui";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import { herstellerNamen, offeneVorschlaegeFuerAdmin, terpenNamen } from "@/lib/query/vorschlaege";
import { freigabeVorbelegen, quelleAlsLink, vorschlaegeBuendeln } from "@/lib/vorschlag-eingabe";

const DATUM = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });
const HERSTELLER_LISTE = "freigabe-hersteller-liste";

/** Offene Bluetenvorschlaege, gleiche gebuendelt, aelteste zuerst (Spec 4.2). */
export async function BlueteVorschlaege() {
  const [offene, terpene, strains, hersteller] = await Promise.all([
    offeneVorschlaegeFuerAdmin(),
    terpenNamen(),
    ladeStrainAuswahl({ mitInaktiven: true }),
    herstellerNamen(),
  ]);
  const gruppen = vorschlaegeBuendeln(offene);
  const katalog = strains.map((s) => ({ wert: s.id, label: s.aktiv ? s.handelsname : `${s.handelsname} (inaktiv)` }));

  return (
    <section aria-labelledby="vorschlaege-titel">
      <Card>
        <CardHeader>
          <h2 id="vorschlaege-titel" className="text-h3 text-text">
            Vorgeschlagene Blüten
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-8">
          {/* Eine Liste fuer alle Formulare: bestehende Hersteller waehlen oder neuen Namen tippen (Spec 4.2). */}
          <datalist id={HERSTELLER_LISTE}>
            {hersteller.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
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
                        <Avatar name={v.anzeigename} bildId={v.avatarId} groesse="sm" className="mr-2 align-middle" />
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
                  herstellerListe={HERSTELLER_LISTE}
                />
              </article>
            ))
          )}
        </CardBody>
      </Card>
    </section>
  );
}
