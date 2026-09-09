import { FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Projekt } from "@/lib/projekte";

type Props = {
  projekte: Projekt[];
};

function datum(wert: string | null | undefined): string {
  if (!wert) return "–";
  const d = new Date(wert);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("de-DE");
}

function kuerzen(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Exportiert alle Projekte als PDF-Liste (Titel, Partner, Status, Frist, letzte Aktualisierung). */
export function PdfExportButton({ projekte }: Props) {
  const [laeuft, setLaeuft] = useState(false);

  async function exportieren() {
    if (projekte.length === 0) {
      toast.info("Es gibt noch keine Projekte zum Exportieren.");
      return;
    }
    setLaeuft(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const seitenBreite = doc.internal.pageSize.getWidth();
      const seitenHoehe = doc.internal.pageSize.getHeight();
      const rand = 40;
      const spalten = [
        { label: "Titel", x: rand, max: 34 },
        { label: "Partnerorganisation", x: rand + 230, max: 26 },
        { label: "Status", x: rand + 400, max: 24 },
        { label: "Nächste Frist", x: rand + 560, max: 14 },
        { label: "Letzte Aktualisierung", x: rand + 650, max: 14 },
      ];

      let y = rand;

      const kopf = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Project Partner Compass – Projektliste", rand, y);
        y += 18;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(
          `Export vom ${new Date().toLocaleString("de-DE")} · ${projekte.length} Projekte · Beispieldaten sind fiktiv`,
          rand,
          y,
        );
        y += 22;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        for (const spalte of spalten) doc.text(spalte.label, spalte.x, y);
        y += 6;
        doc.setDrawColor(180);
        doc.line(rand, y, seitenBreite - rand, y);
        y += 14;
        doc.setFont("helvetica", "normal");
      };

      kopf();

      const sortiert = [...projekte].sort(
        (a, b) =>
          a.status.localeCompare(b.status) ||
          (a.naechste_frist ?? "9999").localeCompare(b.naechste_frist ?? "9999"),
      );

      for (const projekt of sortiert) {
        if (y > seitenHoehe - rand) {
          doc.addPage();
          y = rand;
          kopf();
        }
        const werte = [
          projekt.titel,
          projekt.partnerorganisation || "–",
          projekt.status,
          datum(projekt.naechste_frist),
          datum(projekt.letzte_aktualisierung),
        ];
        werte.forEach((wert, index) => {
          const spalte = spalten[index]!;
          doc.text(kuerzen(String(wert), spalte.max), spalte.x, y);
        });
        y += 16;
      }

      const dateiname = `projektliste-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(dateiname);
      toast.success("PDF-Liste wurde erstellt.");
    } catch (fehler) {
      toast.error(
        `Der PDF-Export ist fehlgeschlagen: ${fehler instanceof Error ? fehler.message : "Unbekannter Fehler"}`,
      );
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={exportieren} disabled={laeuft}>
      <FileDown className="mr-2 size-4" aria-hidden />
      {laeuft ? "Erstellt PDF…" : "Als PDF exportieren"}
    </Button>
  );
}
