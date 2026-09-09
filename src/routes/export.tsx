import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Reiter } from "@/components/Reiter";
import { Button } from "@/components/ui/button";
import { DokumentListe } from "@/components/DokumentListe";
import { dokumentHochladen, dokumenteQueryOptions } from "@/lib/dokumente";
import { kontakteFuerPartner, kontakteQueryOptions } from "@/lib/kontakte";
import { meilensteineQueryOptions } from "@/lib/meilensteine";
import { berichtPdfDatei, datumText, projektBerichtExportieren } from "@/lib/projekt-pdf";
import { projekteQueryOptions } from "@/lib/projekte";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Partnerbericht exportieren – Project Partner Compass" },
      {
        name: "description",
        content:
          "Ein Projekt samt Meilensteinen, Dokumenten und Partnerkontakten als PDF-Bericht für Partnerorganisationen ausgeben.",
      },
      { property: "og:title", content: "Partnerbericht exportieren – Project Partner Compass" },
      {
        property: "og:description",
        content: "PDF-Bericht je Projekt mit Meilensteinen, Dokumenten und Partnerkontakten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExportSeite,
});

function Block({ titel, anzahl, children }: { titel: string; anzahl: number; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="mb-2 text-sm font-semibold">
        {titel} <span className="text-muted-foreground">({anzahl})</span>
      </h3>
      {children}
    </section>
  );
}

function ExportSeite() {
  const { data: projekte = [], isLoading, error } = useQuery(projekteQueryOptions);
  const { data: alleMeilensteine = [] } = useQuery(meilensteineQueryOptions);
  const { data: alleKontakte = [] } = useQuery(kontakteQueryOptions);

  const [projektId, setProjektId] = useState<string>("");
  const [laeuft, setLaeuft] = useState(false);
  const [speichert, setSpeichert] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projektId && projekte.length > 0) setProjektId(projekte[0]!.id);
  }, [projekte, projektId]);

  const projekt = projekte.find((p) => p.id === projektId) ?? null;
  const meilensteine = alleMeilensteine.filter((m) => m.projekt_id === projektId);
  const kontakte = kontakteFuerPartner(alleKontakte, projekt?.partnerorganisation ?? null);
  const { data: dokumente = [] } = useQuery({
    ...dokumenteQueryOptions(projektId),
    enabled: Boolean(projektId),
  });

  async function exportieren() {
    if (!projekt) return;
    setLaeuft(true);
    try {
      const name = await projektBerichtExportieren({ projekt, meilensteine, dokumente, kontakte });
      toast.success(`PDF erstellt: ${name}`);
    } catch (fehler) {
      toast.error(
        `Export fehlgeschlagen: ${fehler instanceof Error ? fehler.message : "Unbekannter Fehler"}`,
      );
    } finally {
      setLaeuft(false);
    }
  }

  /** Legt den Bericht als PDF-Datei bei den Projektdokumenten ab. */
  async function imProjektSpeichern() {
    if (!projekt) return;
    setSpeichert(true);
    try {
      const datei = await berichtPdfDatei({ projekt, meilensteine, dokumente, kontakte });
      await dokumentHochladen(projekt.id, datei);
      await queryClient.invalidateQueries({ queryKey: ["dokumente", projekt.id] });
      toast.success(`Bericht im Projekt gespeichert: ${datei.name}`);
    } catch (fehler) {
      toast.error(
        `Speichern fehlgeschlagen: ${fehler instanceof Error ? fehler.message : "Unbekannter Fehler"}`,
      );
    } finally {
      setSpeichert(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold">Export für Partnerberichte</h1>
            <p className="text-sm text-muted-foreground">
              Ein Projekt mit Meilensteinen, Dokumenten und Partnerkontakten als PDF ausgeben
            </p>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-5 px-6 py-6">
        {isLoading && <p className="text-sm text-muted-foreground">Projekte werden geladen…</p>}
        {error && (
          <p className="text-sm text-destructive">Projekte konnten nicht geladen werden: {error.message}</p>
        )}

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="min-w-64 flex-1">
            <label htmlFor="projekt-auswahl" className="mb-1 block text-sm font-medium">
              Projekt auswählen
            </label>
            <select
              id="projekt-auswahl"
              value={projektId}
              onChange={(e) => setProjektId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {projekte.length === 0 && <option value="">Keine Projekte vorhanden</option>}
              {projekte.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titel}
                  {p.partnerorganisation ? ` – ${p.partnerorganisation}` : ""}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={exportieren} disabled={!projekt || laeuft}>
            <FileDown className="mr-2 size-4" aria-hidden />
            {laeuft ? "Erstellt PDF…" : "Als PDF exportieren"}
          </Button>
          <Button variant="secondary" onClick={imProjektSpeichern} disabled={!projekt || speichert}>
            <Save className="mr-2 size-4" aria-hidden />
            {speichert ? "Speichert…" : "Im Projekt speichern"}
          </Button>
        </div>

        {projekt && (
          <>
            <Block titel="Projektdaten" anzahl={1}>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[
                  ["Partnerorganisation", projekt.partnerorganisation || "–"],
                  ["Partnertyp", projekt.partner_typ || "–"],
                  ["Status", projekt.status],
                  ["Nächste Frist", datumText(projekt.naechste_frist)],
                  ["Themenbereich", projekt.themenbereich || "–"],
                  ["Verantwortliche Person", projekt.verantwortliche_person || "–"],
                  ["Fördermittelbezug", projekt.foerdermittelbezug || "–"],
                  ["Letzte Aktualisierung", datumText(projekt.letzte_aktualisierung)],
                ].map(([label, wert]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd>{wert}</dd>
                  </div>
                ))}
              </dl>
              {projekt.kurzbeschreibung && (
                <p className="mt-3 text-sm text-muted-foreground">{projekt.kurzbeschreibung}</p>
              )}
            </Block>

            <Block titel="Meilensteine" anzahl={meilensteine.length}>
              {meilensteine.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Meilensteine erfasst.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {meilensteine.map((m) => (
                    <li key={m.id} className="flex flex-wrap gap-2">
                      <span className="text-muted-foreground">{m.erledigt ? "Erledigt" : "Offen"}</span>
                      <span className="font-medium">{m.titel}</span>
                      <span className="text-muted-foreground">Frist: {datumText(m.frist)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            <Block titel="Gespeicherte Berichte und Dateien" anzahl={dokumente.length}>
              <p className="mb-3 text-xs text-muted-foreground">
                Gespeicherte Berichte lassen sich hier jederzeit erneut öffnen, ohne das PDF neu zu
                erzeugen.
              </p>
              <DokumentListe projektId={projekt.id} />
            </Block>

            <Block titel="Dokumente im Bericht" anzahl={dokumente.length}>
              {dokumente.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Dokumente hochgeladen.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {dokumente.map((d) => (
                    <li key={d.id}>
                      <span className="font-medium">{d.dateiname}</span>{" "}
                      <span className="text-muted-foreground">({datumText(d.created_at)})</span>
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            <Block titel="Partnerkontakte" anzahl={kontakte.length}>
              {kontakte.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Für diese Partnerorganisation sind noch keine Kontakte hinterlegt.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {kontakte.map((k) => (
                    <li key={k.id}>
                      <span className="font-medium">{k.name}</span>{" "}
                      <span className="text-muted-foreground">
                        {[k.rolle, k.email, k.telefon].filter(Boolean).join(" · ") || "keine Kontaktdaten"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Block>
          </>
        )}
      </div>
    </main>
  );
}
