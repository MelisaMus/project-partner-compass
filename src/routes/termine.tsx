import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

import { FristAlarmPanel } from "@/components/FristAlarmPanel";
import { MeilensteinPlaner } from "@/components/MeilensteinPlaner";
import { Reiter } from "@/components/Reiter";
import { fristAmpel, fristLabel } from "@/lib/fristen";
import { meilensteineQueryOptions, type Meilenstein } from "@/lib/meilensteine";
import { projekteQueryOptions, type Projekt } from "@/lib/projekte";
import { AMPEL_KLASSEN, datumText } from "@/lib/darstellung";

export const Route = createFileRoute("/termine")({
  head: () => ({
    meta: [
      { title: "Termine & Fristen – Project Partner Compass" },
      {
        name: "description",
        content:
          "Termine je Projekt planen und alle überfälligen oder bald fälligen Fristen im Blick behalten.",
      },
      { property: "og:title", content: "Termine & Fristen – Project Partner Compass" },
      {
        property: "og:description",
        content:
          "Kick-off, Berichtsfristen und Frist-Alarm für alle Teilprojekte auf einer Seite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/termine" }],
  }),
  component: TerminePlanerSeite,
});



function TerminePlanerSeite() {
  const { data: projekte = [], isLoading, error } = useQuery(projekteQueryOptions);
  const { data: meilensteine = [] } = useQuery(meilensteineQueryOptions);

  const proProjekt = useMemo(() => {
    const karte = new Map<string, Meilenstein[]>();
    for (const m of meilensteine) {
      const liste = karte.get(m.projekt_id) ?? [];
      liste.push(m);
      karte.set(m.projekt_id, liste);
    }
    return karte;
  }, [meilensteine]);

  const projektNamen = useMemo(() => {
    const karte = new Map<string, Projekt>();
    for (const p of projekte) karte.set(p.id, p);
    return karte;
  }, [projekte]);

  const naechsteTermine = useMemo(
    () =>
      meilensteine
        .filter((m) => !m.erledigt && m.frist)
        .sort((a, b) => (a.frist ?? "").localeCompare(b.frist ?? ""))
        .slice(0, 10),
    [meilensteine],
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <CalendarDays className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Termine & Fristen</h1>
              <p className="text-sm text-muted-foreground">
                Termine je Projekt planen – Kick-off, Berichtsfrist – und alle nahen Fristen im Blick
              </p>
            </div>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {error ? (
          <p className="rounded-lg bg-ampel-rot px-4 py-3 text-sm text-ampel-rot-foreground">
            Die Projekte konnten nicht geladen werden: {(error as Error).message}
          </p>
        ) : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Lädt…</p> : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Frist-Alarm</h2>
          <FristAlarmPanel />
        </section>



        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">Nächste Termine</h2>
          {naechsteTermine.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Noch keine offenen Termine eingetragen.
            </p>
          ) : (
            <ul className="mt-3 space-y-1">
              {naechsteTermine.map((termin) => (
                <li
                  key={termin.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface"
                >
                  <span>
                    <span className="font-medium">{termin.titel}</span>
                    <span className="text-muted-foreground">
                      {" · "}
                      {projektNamen.get(termin.projekt_id)?.titel ?? "Unbekanntes Projekt"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{datumText(termin.frist, "ohne Datum")}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${AMPEL_KLASSEN[fristAmpel(termin.frist)]}`}
                    >
                      {fristLabel(termin.frist)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {projekte.map((projekt) => (
          <section
            key={projekt.id}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">{projekt.titel}</h2>
              <span className="text-xs text-muted-foreground">
                {projekt.partnerorganisation || "Partner offen"} · {projekt.status}
              </span>
            </div>
            <div className="mt-3">
              <MeilensteinPlaner
                projektId={projekt.id}
                meilensteine={proProjekt.get(projekt.id) ?? []}
              />
            </div>
          </section>
        ))}

        {!isLoading && projekte.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Lege zuerst ein Projekt auf dem Board an, dann kannst du Termine planen.
          </p>
        ) : null}
      </div>
    </main>
  );
}
