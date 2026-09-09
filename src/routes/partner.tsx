import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useMemo } from "react";

import { Reiter } from "@/components/Reiter";
import { fristAmpel, fristLabel } from "@/lib/fristen";
import { STATUS_SPALTEN, projekteQueryOptions, type Projekt } from "@/lib/projekte";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partnerorganisationen – Project Partner Compass" },
      {
        name: "description",
        content:
          "Alle Teilprojekte nach Partnerorganisation gruppiert – mit Anzahl in Anbahnung, Laufend und Berichtspflicht fällig.",
      },
      { property: "og:title", content: "Partnerorganisationen – Project Partner Compass" },
      {
        property: "og:description",
        content: "Wie viele Projekte laufen pro Partnerorganisation – und in welchem Status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/partner" }],
  }),
  component: PartnerSeite,
});

const AMPEL_KLASSEN = {
  gruen: "bg-ampel-gruen text-ampel-gruen-foreground",
  gelb: "bg-ampel-gelb text-ampel-gelb-foreground",
  rot: "bg-ampel-rot text-ampel-rot-foreground",
  keine: "bg-ampel-keine text-ampel-keine-foreground",
} as const;

type PartnerGruppe = {
  partner: string;
  projekte: Projekt[];
  proStatus: Record<string, number>;
};

function gruppiere(projekte: Projekt[]): PartnerGruppe[] {
  const karte = new Map<string, Projekt[]>();
  for (const projekt of projekte) {
    const partner = projekt.partnerorganisation?.trim() || "Ohne Partnerangabe";
    const liste = karte.get(partner) ?? [];
    liste.push(projekt);
    karte.set(partner, liste);
  }

  return [...karte.entries()]
    .map(([partner, liste]) => {
      const proStatus: Record<string, number> = {};
      for (const status of STATUS_SPALTEN) proStatus[status] = 0;
      for (const projekt of liste) {
        proStatus[projekt.status] = (proStatus[projekt.status] ?? 0) + 1;
      }
      return { partner, projekte: liste, proStatus };
    })
    .sort((a, b) => b.projekte.length - a.projekte.length || a.partner.localeCompare(b.partner));
}

const HERVORGEHOBEN = ["Anbahnung", "Laufend", "Berichtspflicht fällig"] as const;

function PartnerSeite() {
  const { data: projekte, isLoading, error } = useQuery(projekteQueryOptions);
  const gruppen = useMemo(() => gruppiere(projekte ?? []), [projekte]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Partnerorganisationen</h1>
              <p className="text-sm text-muted-foreground">
                Alle Teilprojekte gruppiert nach Partner – mit Statusverteilung
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

        {!isLoading && gruppen.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Projekte vorhanden.</p>
        ) : null}

        {gruppen.map((gruppe) => (
          <section
            key={gruppe.partner}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{gruppe.partner}</h2>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                {gruppe.projekte.length}{" "}
                {gruppe.projekte.length === 1 ? "Projekt" : "Projekte"}
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {HERVORGEHOBEN.map((status) => (
                <div key={status} className="rounded-lg border border-border bg-surface px-3 py-2">
                  <p className="text-xs text-muted-foreground">{status}</p>
                  <p className="text-xl font-semibold">{gruppe.proStatus[status] ?? 0}</p>
                </div>
              ))}
            </div>

            <ul className="mt-4 space-y-1">
              {gruppe.projekte.map((projekt) => (
                <li
                  key={projekt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface"
                >
                  <span className="font-medium">{projekt.titel}</span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                      {projekt.status}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${AMPEL_KLASSEN[fristAmpel(projekt.naechste_frist)]}`}
                    >
                      {fristLabel(projekt.naechste_frist)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          Alle mit „Beispielprojekt“ gekennzeichneten Einträge sind fiktive Testdaten. Details und
          Meilensteine findest du in der{" "}
          <Link to="/uebersicht" className="underline">
            Übersicht
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
