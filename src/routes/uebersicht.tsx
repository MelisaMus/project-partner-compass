import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, CalendarClock, ChevronRight, Compass, ListTree } from "lucide-react";
import { useMemo, useState } from "react";

import { Reiter } from "@/components/Reiter";
import { Button } from "@/components/ui/button";
import { fristAmpel, fristLabel, tageBisFrist, type FristAmpel } from "@/lib/fristen";
import { STATUS_SPALTEN, projekteQueryOptions, type Projekt } from "@/lib/projekte";

export const Route = createFileRoute("/uebersicht")({
  head: () => ({
    meta: [
      { title: "Übersicht aller Projekte – Partner Compass" },
      {
        name: "description",
        content:
          "Alle Teilprojekte gruppiert nach Status, Partnerorganisation und Frist – als kompakte Liste ohne Board-Scrollen.",
      },
      { property: "og:title", content: "Übersicht aller Projekte – Partner Compass" },
      {
        property: "og:description",
        content: "Gruppierte Liste aller Teilprojekte nach Status, Partner und Fristenlage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Uebersicht,
});

const AMPEL_KLASSEN: Record<FristAmpel, string> = {
  gruen: "bg-ampel-gruen text-ampel-gruen-foreground",
  gelb: "bg-ampel-gelb text-ampel-gelb-foreground",
  rot: "bg-ampel-rot text-ampel-rot-foreground",
  keine: "bg-ampel-keine text-ampel-keine-foreground",
};

type Gruppierung = "status" | "partner" | "frist";

const FRIST_GRUPPEN = [
  "Überfällig",
  "Diese Woche",
  "In 1–4 Wochen",
  "Später als 4 Wochen",
  "Ohne Frist",
] as const;

function fristGruppe(projekt: Projekt): (typeof FRIST_GRUPPEN)[number] {
  const tage = tageBisFrist(projekt.naechste_frist);
  if (tage === null) return "Ohne Frist";
  if (tage < 0) return "Überfällig";
  if (tage < 7) return "Diese Woche";
  if (tage <= 28) return "In 1–4 Wochen";
  return "Später als 4 Wochen";
}

function gruppen(projekte: Projekt[], modus: Gruppierung): { titel: string; karten: Projekt[] }[] {
  if (modus === "status") {
    return STATUS_SPALTEN.map((status) => ({
      titel: status,
      karten: projekte.filter((p) => p.status === status),
    }));
  }
  if (modus === "frist") {
    return FRIST_GRUPPEN.map((gruppe) => ({
      titel: gruppe,
      karten: projekte.filter((p) => fristGruppe(p) === gruppe),
    }));
  }
  const partner = Array.from(
    new Set(projekte.map((p) => p.partnerorganisation?.trim() || "Partner offen")),
  ).sort((a, b) => a.localeCompare(b, "de"));
  return partner.map((name) => ({
    titel: name,
    karten: projekte.filter((p) => (p.partnerorganisation?.trim() || "Partner offen") === name),
  }));
}

function fristText(frist: string | null): string {
  if (!frist) return fristLabel(frist);
  const datum = new Date(`${frist.slice(0, 10)}T00:00:00Z`).toLocaleDateString("de-DE");
  return `${datum} · ${fristLabel(frist)}`;
}

function DetailFeld({ label, wert }: { label: string; wert: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{wert && wert.trim() ? wert : "–"}</dd>
    </div>
  );
}

function Zeile({ projekt, meilensteine }: { projekt: Projekt; meilensteine: Meilenstein[] }) {
  const ampel = fristAmpel(projekt.naechste_frist);
  const [offen, setOffen] = useState(false);
  const detailId = `details-${projekt.id}`;
  const naechster = naechsterOffenerMeilenstein(meilensteine);
  const offeneAnzahl = meilensteine.filter((m) => !m.erledigt).length;


  return (
    <li className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOffen((alt) => !alt)}
        aria-expanded={offen}
        aria-controls={detailId}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex min-w-0 items-start gap-2">
          <ChevronRight
            className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${offen ? "rotate-90" : ""}`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-snug">{projekt.titel}</span>
            <span className="block text-xs text-muted-foreground">
              {[
                projekt.partnerorganisation || "Partner offen",
                projekt.status,
                projekt.themenbereich || null,
                projekt.verantwortliche_person || null,
                projekt.foerdermittelbezug || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AMPEL_KLASSEN[ampel]}`}>
          {fristText(projekt.naechste_frist)}
        </span>
      </button>

      {offen ? (
        <div id={detailId} className="border-t border-border bg-surface px-3 py-3">
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailFeld label="Titel" wert={projekt.titel} />
            <DetailFeld label="Partnerorganisation" wert={projekt.partnerorganisation} />
            <DetailFeld label="Partnertyp" wert={projekt.partner_typ} />
            <DetailFeld label="Status" wert={projekt.status} />
            <DetailFeld label="Nächste Frist" wert={fristText(projekt.naechste_frist)} />
            <DetailFeld label="Themenbereich" wert={projekt.themenbereich} />
            <DetailFeld label="Verantwortlich" wert={projekt.verantwortliche_person} />
            <DetailFeld label="Fördermittelbezug" wert={projekt.foerdermittelbezug} />
          </dl>
          <div className="mt-3">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Kurzbeschreibung
            </dt>
            <dd className="whitespace-pre-line text-sm">
              {projekt.kurzbeschreibung?.trim() || "Keine Beschreibung hinterlegt."}
            </dd>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Uebersicht() {
  const { data: projekte = [], isLoading, error } = useQuery(projekteQueryOptions);
  const [modus, setModus] = useState<Gruppierung>("status");

  const abschnitte = useMemo(() => gruppen(projekte, modus), [projekte, modus]);

  const knoepfe: { wert: Gruppierung; label: string; icon: React.ReactNode }[] = [
    { wert: "status", label: "Status", icon: <ListTree className="size-4" aria-hidden /> },
    { wert: "partner", label: "Partnerorganisation", icon: <Building2 className="size-4" aria-hidden /> },
    { wert: "frist", label: "Frist", icon: <CalendarClock className="size-4" aria-hidden /> },
  ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Compass className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Übersicht aller Projekte</h1>
              <p className="text-sm text-muted-foreground">
                Gruppiert nach Status, Partnerorganisation oder Fristenlage
              </p>
            </div>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Gruppierung wählen">
          {knoepfe.map((k) => (
            <Button
              key={k.wert}
              size="sm"
              variant={modus === k.wert ? "default" : "outline"}
              onClick={() => setModus(k.wert)}
            >
              {k.icon} {k.label}
            </Button>
          ))}
        </div>

        {error ? (
          <p className="rounded-lg bg-ampel-rot px-4 py-3 text-sm text-ampel-rot-foreground">
            Die Projekte konnten nicht geladen werden: {(error as Error).message}
          </p>
        ) : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Lädt…</p> : null}

        {abschnitte.map((abschnitt) => (
          <section key={abschnitt.titel} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{abschnitt.titel}</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {abschnitt.karten.length}
              </span>
            </div>
            {abschnitt.karten.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                Keine Projekte in dieser Gruppe
              </p>
            ) : (
              <ul className="space-y-2">
                {abschnitt.karten.map((p) => (
                  <Zeile key={p.id} projekt={p} />
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          Alle Beispielkarten sind fiktiv und nicht an eine bestimmte Institution gebunden.
        </p>
      </div>
    </main>
  );
}
