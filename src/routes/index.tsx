import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Compass, FileWarning, LayoutGrid, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FristAlarm } from "@/components/FristAlarm";
import { KartenDialog } from "@/components/KartenDialog";
import { MeilensteinPlaner } from "@/components/MeilensteinPlaner";
import { PdfExportButton } from "@/components/PdfExportButton";
import { Projektsituation } from "@/components/Projektsituation";

import { Reiter } from "@/components/Reiter";
import { Button } from "@/components/ui/button";
import { fristAmpel, fristLabel, hatFristInnerhalb } from "@/lib/fristen";
import { meilensteineQueryOptions, naechsterOffenerMeilenstein } from "@/lib/meilensteine";
import { AMPEL_KLASSEN } from "@/lib/darstellung";
import {
  STATUS_SPALTEN,
  projektAktualisieren,
  projektAnlegen,
  projektLoeschen,
  projekteQueryOptions,
  type Projekt,
  type ProjektEingabe,
} from "@/lib/projekte";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Partner Compass – Board für Multi-Partner-Projekte" },
      {
        name: "description",
        content:
          "Kanban-Board mit Statusabfrage für Projekte mit internen und externen Partnerorganisationen und parallelen Fristen.",
      },
      { property: "og:title", content: "Project Partner Compass – Board für Multi-Partner-Projekte" },
      {
        property: "og:description",
        content:
          "Teilprojekte mit externen Partnern koordinieren: Board, Fristen-Ampel und Fragen zum aktuellen Stand.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Board,
});



function Board() {
  const queryClient = useQueryClient();
  const { data: projekte = [], isLoading, error } = useQuery(projekteQueryOptions);
  const { data: alleMeilensteine } = useQuery(meilensteineQueryOptions);

  const [dialogOffen, setDialogOffen] = useState(false);
  const [aktuelleKarte, setAktuelleKarte] = useState<Projekt | null>(null);
  const [ziehtId, setZiehtId] = useState<string | null>(null);
  const [zielSpalte, setZielSpalte] = useState<string | null>(null);
  const [planerOffen, setPlanerOffen] = useState<Set<string>>(new Set());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: projekteQueryOptions.queryKey });

  const speichern = useMutation({
    mutationFn: async (eingabe: ProjektEingabe) => {
      if (aktuelleKarte) return projektAktualisieren(aktuelleKarte.id, eingabe);
      return projektAnlegen(eingabe);
    },
    onSuccess: () => {
      toast.success(aktuelleKarte ? "Karte aktualisiert" : "Karte angelegt");
      setDialogOffen(false);
      setAktuelleKarte(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const loeschen = useMutation({
    mutationFn: projektLoeschen,
    onSuccess: () => {
      toast.success("Karte gelöscht");
      setDialogOffen(false);
      setAktuelleKarte(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusVerschieben = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => projektAktualisieren(id, { status }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const kennzahlen = useMemo(
    () => ({
      gesamt: projekte.length,
      fristZweiWochen: projekte.filter((p) => hatFristInnerhalb(p.naechste_frist, 14)).length,
      berichtspflicht: projekte.filter((p) => p.status === "Berichtspflicht fällig").length,
    }),
    [projekte],
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Projekt-Koordination
            </h1>
            <p className="mt-1 text-muted-foreground">
              Koordination von Teilprojekten mit internen und externen Partnerorganisationen
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Reiter />
            <PdfExportButton projekte={projekte} />
            <Button
              onClick={() => {
                setAktuelleKarte(null);
                setDialogOffen(true);
              }}
            >
              <Plus className="size-4" aria-hidden /> Neue Karte
            </Button>
          </div>
        </div>

        <Projektsituation projekte={projekte} />
      </header>

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <FristAlarm
          projekte={projekte}
          onKarteOeffnen={(karte) => {
            setAktuelleKarte(karte);
            setDialogOffen(true);
          }}
        />




        {error ? (
          <p className="rounded-lg bg-ampel-rot px-4 py-3 text-sm text-ampel-rot-foreground">
            Die Karten konnten nicht geladen werden: {(error as Error).message}
          </p>
        ) : null}

        <section aria-label="Kanban-Board" className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
            {STATUS_SPALTEN.map((spalte) => {
              const karten = projekte.filter((p) => p.status === spalte);
              return (
                <div
                  key={spalte}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setZielSpalte(spalte);
                  }}
                  onDragLeave={() => setZielSpalte((alt) => (alt === spalte ? null : alt))}
                  onDrop={() => {
                    setZielSpalte(null);
                    const karte = projekte.find((p) => p.id === ziehtId);
                    setZiehtId(null);
                    if (karte && karte.status !== spalte) {
                      statusVerschieben.mutate({ id: karte.id, status: spalte });
                    }
                  }}
                  className={`w-80 shrink-0 rounded-2xl border p-4 transition-colors ${
                    zielSpalte === spalte
                      ? "border-primary bg-accent/10"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                    <h2 className="font-display text-sm font-bold uppercase tracking-wider text-secondary-foreground">
                      {spalte}
                    </h2>
                    <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-semibold text-navy-foreground">
                      {karten.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground">Lädt…</p>
                    ) : null}
                    {karten.map((karte) => {
                      const ampel = fristAmpel(karte.naechste_frist);
                      const karteMeilensteine = (alleMeilensteine ?? []).filter(
                        (m) => m.projekt_id === karte.id,
                      );
                      const offeneMeilensteine = karteMeilensteine.filter((m) => !m.erledigt);
                      const naechsterMeilenstein = naechsterOffenerMeilenstein(karteMeilensteine);
                      return (
                        <article
                          key={karte.id}
                          draggable
                          onDragStart={() => setZiehtId(karte.id)}
                          onDragEnd={() => setZiehtId(null)}
                          onClick={() => {
                            setAktuelleKarte(karte);
                            setDialogOffen(true);
                          }}
                          className="cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md"
                        >
                          <h3 className="font-display text-[15px] font-bold leading-snug text-foreground">
                            {karte.titel}
                          </h3>
                          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                            {karte.partnerorganisation || "Partner offen"}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AMPEL_KLASSEN[ampel]}`}
                            >
                              {fristLabel(karte.naechste_frist)}
                            </span>
                            {karte.themenbereich ? (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                                {karte.themenbereich}
                              </span>
                            ) : null}
                            {karteMeilensteine.length > 0 ? (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                                {offeneMeilensteine.length}/{karteMeilensteine.length} Meilensteine
                              </span>
                            ) : null}
                          </div>
                          {naechsterMeilenstein ? (
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Nächster Meilenstein: {naechsterMeilenstein.titel} (
                              {fristLabel(naechsterMeilenstein.frist)})
                            </p>
                          ) : null}

                          {karteMeilensteine.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                              {karteMeilensteine.slice(0, 4).map((m) => (
                                <li
                                  key={m.id}
                                  className="flex items-center justify-between gap-2 text-[11px]"
                                >
                                  <span
                                    className={`min-w-0 truncate ${m.erledigt ? "text-muted-foreground line-through" : ""}`}
                                  >
                                    {m.titel}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded-full px-1.5 py-0.5 font-medium ${
                                      m.erledigt
                                        ? "bg-secondary text-secondary-foreground"
                                        : AMPEL_KLASSEN[fristAmpel(m.frist)]
                                    }`}
                                  >
                                    {fristLabel(m.frist)}
                                  </span>
                                </li>
                              ))}
                              {karteMeilensteine.length > 4 ? (
                                <li className="text-[11px] text-muted-foreground">
                                  + {karteMeilensteine.length - 4} weitere
                                </li>
                              ) : null}
                            </ul>
                          ) : null}

                          <div
                            className="mt-2 border-t border-border pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setPlanerOffen((alt) => {
                                  const neu = new Set(alt);
                                  if (neu.has(karte.id)) neu.delete(karte.id);
                                  else neu.add(karte.id);
                                  return neu;
                                })
                              }
                              aria-expanded={planerOffen.has(karte.id)}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              {planerOffen.has(karte.id) ? "Planer schließen" : "Milestones planen"}
                            </button>
                            <Link
                              to="/uebersicht"
                              className="ml-3 text-[11px] text-muted-foreground hover:underline"
                            >
                              In Übersicht öffnen
                            </Link>
                            {planerOffen.has(karte.id) ? (
                              <div className="mt-2 rounded-md bg-surface px-2 py-1">
                                <MeilensteinPlaner
                                  projektId={karte.id}
                                  meilensteine={karteMeilensteine}
                                />
                              </div>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                    {!isLoading && karten.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        Karten hierher ziehen
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          Alle Beispielkarten sind fiktiv. Das Board ist als generisches Werkzeug für
          Multi-Partner-Koordination gedacht und nicht an eine bestimmte Institution gebunden.
        </p>
      </div>

      <KartenDialog
        offen={dialogOffen}
        projekt={aktuelleKarte}
        onClose={() => {
          setDialogOffen(false);
          setAktuelleKarte(null);
        }}
        onSpeichern={(eingabe) => speichern.mutateAsync(eingabe)}
        onLoeschen={(id) => loeschen.mutateAsync(id)}
      />
    </main>
  );
}
