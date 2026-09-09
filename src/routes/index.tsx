import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Compass, FileWarning, LayoutGrid, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FristAlarm } from "@/components/FristAlarm";
import { KartenDialog } from "@/components/KartenDialog";
import { PdfExportButton } from "@/components/PdfExportButton";
import { Reiter } from "@/components/Reiter";
import { Button } from "@/components/ui/button";
import { fristAmpel, fristLabel, hatFristInnerhalb, type FristAmpel } from "@/lib/fristen";
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

const AMPEL_KLASSEN: Record<FristAmpel, string> = {
  gruen: "bg-ampel-gruen text-ampel-gruen-foreground",
  gelb: "bg-ampel-gelb text-ampel-gelb-foreground",
  rot: "bg-ampel-rot text-ampel-rot-foreground",
  keine: "bg-ampel-keine text-ampel-keine-foreground",
};

function Kachel({
  icon,
  wert,
  label,
}: {
  icon: React.ReactNode;
  wert: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <span>
        <span className="block text-2xl font-semibold leading-none">{wert}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function Board() {
  const queryClient = useQueryClient();
  const { data: projekte = [], isLoading, error } = useQuery(projekteQueryOptions);

  const [dialogOffen, setDialogOffen] = useState(false);
  const [aktuelleKarte, setAktuelleKarte] = useState<Projekt | null>(null);
  const [ziehtId, setZiehtId] = useState<string | null>(null);
  const [zielSpalte, setZielSpalte] = useState<string | null>(null);

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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Compass className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Project Partner Compass</h1>
              <p className="text-sm text-muted-foreground">
                Koordination von Teilprojekten mit internen und externen Partnerorganisationen
              </p>
            </div>
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
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Kachel icon={<LayoutGrid className="size-5" aria-hidden />} wert={kennzahlen.gesamt} label="Projekte gesamt" />
          <Kachel
            icon={<CalendarClock className="size-5" aria-hidden />}
            wert={kennzahlen.fristZweiWochen}
            label="Frist in den nächsten 2 Wochen"
          />
          <Kachel
            icon={<FileWarning className="size-5" aria-hidden />}
            wert={kennzahlen.berichtspflicht}
            label="Berichtspflicht fällig"
          />
        </div>

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
                  className={`w-72 shrink-0 rounded-xl border p-3 transition-colors ${
                    zielSpalte === spalte ? "border-primary bg-secondary" : "border-border bg-surface"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">{spalte}</h2>
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
                      {karten.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground">Lädt…</p>
                    ) : null}
                    {karten.map((karte) => {
                      const ampel = fristAmpel(karte.naechste_frist);
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
                          className="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-card transition-shadow hover:shadow-md"
                        >
                          <h3 className="text-sm font-semibold leading-snug">{karte.titel}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {karte.partnerorganisation || "Partner offen"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
