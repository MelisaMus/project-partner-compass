import { Link, createFileRoute } from "@tanstack/react-router";
import { Compass, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AMPEL_KLASSEN, fristText } from "@/lib/darstellung";
import { fristAmpel } from "@/lib/fristen";
import { STATUS_SPALTEN } from "@/lib/projekte";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo-Einblick – Project Partner Compass" },
      {
        name: "description",
        content:
          "Öffentlicher Einblick in die Projektkoordination: Kanban-Board mit Status-Spalten, Fristen-Ampel und Meilensteinen anhand fiktiver Beispielprojekte.",
      },
      { property: "og:title", content: "Demo-Einblick – Project Partner Compass" },
      {
        property: "og:description",
        content:
          "Fiktive Beispielprojekte zeigen, wie Teilprojekte mit mehreren Partnerorganisationen koordiniert werden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoSeite,
});

/** Tage ab heute als Kalendertag – so bleibt die Fristen-Ampel im Demobereich lebendig. */
function inTagen(tage: number): string {
  const datum = new Date();
  datum.setUTCDate(datum.getUTCDate() + tage);
  return datum.toISOString().slice(0, 10);
}

type DemoKarte = {
  titel: string;
  partnerorganisation: string;
  partner_typ: string;
  themenbereich: string;
  verantwortliche_person: string;
  status: string;
  naechste_frist: string | null;
  foerdermittelbezug: string | null;
  kurzbeschreibung: string;
  meilensteine: readonly { titel: string; frist: string | null; erledigt: boolean }[];
};

const DEMO_KARTEN: readonly DemoKarte[] = [
  {
    titel: "Beispielprojekt: Lernwerkstatt Datenkompetenz",
    partnerorganisation: "Stadtwerkstatt Nordlicht gGmbH (fiktiv)",
    partner_typ: "Non-Profit",
    themenbereich: "Digitalisierung",
    verantwortliche_person: "A. Beispiel",
    status: "Laufend",
    naechste_frist: inTagen(5),
    foerdermittelbezug: "Zwischenbericht Q3",
    kurzbeschreibung:
      "Gemeinsame Workshopreihe zu Datenkompetenz; Räume und Technik stellt die Partnerorganisation.",
    meilensteine: [
      { titel: "Kick-off mit Partner", frist: inTagen(-12), erledigt: true },
      { titel: "Zwischenbericht abstimmen", frist: inTagen(5), erledigt: false },
      { titel: "Abschlussworkshop", frist: inTagen(48), erledigt: false },
    ],
  },
  {
    titel: "Beispielprojekt: Beratungsnetzwerk Quartier",
    partnerorganisation: "Musterkreis Verwaltung Süd (fiktiv)",
    partner_typ: "Öffentliche Einrichtung",
    themenbereich: "Beratung",
    verantwortliche_person: "B. Muster",
    status: "In Abstimmung",
    naechste_frist: inTagen(20),
    foerdermittelbezug: null,
    kurzbeschreibung:
      "Konzept für ein gemeinsames Beratungsangebot; Rollen und Zuständigkeiten werden noch geklärt.",
    meilensteine: [{ titel: "Konzeptentwurf versenden", frist: inTagen(20), erledigt: false }],
  },
  {
    titel: "Beispielprojekt: Transferstudie Kreislaufwirtschaft",
    partnerorganisation: "Beispiel Technik & Handel AG (fiktiv)",
    partner_typ: "Unternehmen",
    themenbereich: "Forschung",
    verantwortliche_person: "C. Exempel",
    status: "Berichtspflicht fällig",
    naechste_frist: inTagen(-3),
    foerdermittelbezug: "Abschlussbericht",
    kurzbeschreibung:
      "Auswertung der Pilotphase; der Abschlussbericht an die Fördermittelgebende Stelle ist überfällig.",
    meilensteine: [{ titel: "Abschlussbericht einreichen", frist: inTagen(-3), erledigt: false }],
  },
  {
    titel: "Beispielprojekt: Ideenwerkstatt Ehrenamt",
    partnerorganisation: "Initiative Beispielhafen e. V. (fiktiv)",
    partner_typ: "Non-Profit",
    themenbereich: "Beteiligung",
    verantwortliche_person: "D. Beispielhaft",
    status: "Anbahnung",
    naechste_frist: inTagen(60),
    foerdermittelbezug: null,
    kurzbeschreibung: "Erstes Sondierungsgespräch geführt; Zusammenarbeit noch nicht beschlossen.",
    meilensteine: [],
  },
];

export function DemoSeite() {
  const gesamt = DEMO_KARTEN.length;
  const offeneMeilensteine = DEMO_KARTEN.flatMap((k) => k.meilensteine).filter((m) => !m.erledigt)
    .length;
  const berichtspflicht = DEMO_KARTEN.filter((k) => k.status === "Berichtspflicht fällig").length;

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-navy px-6 py-10 text-navy-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal text-teal-foreground">
              <Compass className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal">
                Demo-Einblick
              </p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                Project Partner Compass
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-navy-foreground/80">
                Koordination von Teilprojekten mit internen und externen Partnerorganisationen. Diese
                Seite zeigt ausschließlich fiktive Beispielprojekte – echte Projektdaten sind
                geschützt.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link to="/auth">Anmelden</Link>
          </Button>
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl gap-3 sm:grid-cols-3">
          {[
            { label: "Beispielprojekte", wert: gesamt },
            { label: "Offene Meilensteine", wert: offeneMeilensteine },
            { label: "Berichtspflicht fällig", wert: berichtspflicht },
          ].map((kachel) => (
            <div key={kachel.label} className="rounded-2xl bg-navy-hover/60 px-5 py-4">
              <p className="font-display text-3xl font-bold">{kachel.wert}</p>
              <p className="mt-1 text-sm text-navy-foreground/80">{kachel.label}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-4">
          <Lock className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Nur-Lesen-Vorschau: Karten anlegen, bearbeiten, Termine, Dokumente, Partnerkontakte und
            die Chat-Abfrage stehen nach der Anmeldung zur Verfügung.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {STATUS_SPALTEN.map((status) => {
            const karten = DEMO_KARTEN.filter((k) => k.status === status);
            return (
              <div key={status} className="rounded-2xl bg-muted/40 p-3">
                <h2 className="px-1 pb-3 text-sm font-semibold">
                  {status}{" "}
                  <span className="font-normal text-muted-foreground">({karten.length})</span>
                </h2>
                <div className="space-y-3">
                  {karten.map((karte) => (
                    <article
                      key={karte.titel}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <h3 className="text-sm font-semibold leading-snug">{karte.titel}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {karte.partnerorganisation}
                      </p>
                      <span
                        className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${AMPEL_KLASSEN[fristAmpel(karte.naechste_frist)]}`}
                      >
                        {fristText(karte.naechste_frist)}
                      </span>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {karte.kurzbeschreibung}
                      </p>
                      {karte.meilensteine.length > 0 ? (
                        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                          {karte.meilensteine.map((m) => (
                            <li key={m.titel} className="flex items-start justify-between gap-2">
                              <span
                                className={`text-xs ${m.erledigt ? "text-muted-foreground line-through" : ""}`}
                              >
                                {m.titel}
                              </span>
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${
                                  m.erledigt
                                    ? "bg-muted text-muted-foreground"
                                    : AMPEL_KLASSEN[fristAmpel(m.frist)]
                                }`}
                              >
                                {m.erledigt ? "erledigt" : fristText(m.frist)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {karte.foerdermittelbezug ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Fördermittelbezug: {karte.foerdermittelbezug}
                        </p>
                      ) : null}
                    </article>
                  ))}
                  {karten.length === 0 ? (
                    <p className="px-1 text-xs text-muted-foreground">
                      Keine Beispielkarte in dieser Spalte.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl bg-navy px-6 py-6 text-navy-foreground">
          <h2 className="font-display text-lg font-bold">Mit eigenen Projekten arbeiten</h2>
          <p className="mt-1 max-w-2xl text-sm text-navy-foreground/80">
            Der Zugang ist auf eingeladene Personen beschränkt. Nach der Anmeldung stehen Board,
            Übersicht, Termine &amp; Fristen, Chat und Berichte vollständig zur Verfügung.
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/auth">Zur Anmeldung</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
