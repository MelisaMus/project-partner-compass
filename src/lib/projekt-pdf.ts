import { datumText } from "@/lib/darstellung";
import type { Dokument } from "@/lib/dokumente";
import type { Kontakt } from "@/lib/kontakte";
import type { Meilenstein } from "@/lib/meilensteine";
import type { Projekt } from "@/lib/projekte";

export type BerichtDaten = {
  projekt: Projekt;
  meilensteine: Meilenstein[];
  dokumente: Dokument[];
  kontakte: Kontakt[];
};


/** Dateiname für den Partnerbericht, z. B. "partnerbericht-transferwerkstatt-2026-09-09.pdf". */
export function berichtDateiname(titel: string, heute: Date = new Date()): string {
  const teil =
    titel
      .toLowerCase()
      .replace(/[äöüß]/g, (z) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[z] ?? z)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "projekt";
  return `partnerbericht-${teil}-${heute.toISOString().slice(0, 10)}.pdf`;
}

/** Erzeugt den Partnerbericht als PDF und startet den Download im Browser. */
async function berichtErzeugen(daten: BerichtDaten) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const breite = doc.internal.pageSize.getWidth();
  const hoehe = doc.internal.pageSize.getHeight();
  const rand = 48;
  const textBreite = breite - rand * 2;
  let y = rand;

  const seitenwechsel = (bedarf = 16) => {
    if (y + bedarf > hoehe - rand) {
      doc.addPage();
      y = rand;
    }
  };

  const zeile = (text: string, groesse = 10, fett = false) => {
    doc.setFont("helvetica", fett ? "bold" : "normal");
    doc.setFontSize(groesse);
    const zeilen = doc.splitTextToSize(text, textBreite) as string[];
    for (const t of zeilen) {
      seitenwechsel(groesse + 4);
      doc.text(t, rand, y);
      y += groesse + 4;
    }
  };

  const abschnitt = (titel: string) => {
    y += 10;
    seitenwechsel(26);
    doc.setDrawColor(200);
    doc.line(rand, y - 6, breite - rand, y - 6);
    zeile(titel, 12, true);
    y += 2;
  };

  const { projekt, meilensteine, dokumente, kontakte } = daten;

  zeile("Project Partner Compass – Partnerbericht", 17, true);
  zeile(`Erstellt am ${new Date().toLocaleString("de-DE")}`, 9);
  y += 6;
  zeile(projekt.titel, 14, true);

  abschnitt("Projektdaten");
  const felder: Array<[string, string]> = [
    ["Partnerorganisation", projekt.partnerorganisation || "–"],
    ["Partnertyp", projekt.partner_typ || "–"],
    ["Status", projekt.status],
    ["Nächste Frist", datumText(projekt.naechste_frist)],
    ["Themenbereich", projekt.themenbereich || "–"],
    ["Verantwortliche Person", projekt.verantwortliche_person || "–"],
    ["Fördermittelbezug", projekt.foerdermittelbezug || "–"],
    ["Letzte Aktualisierung", datumText(projekt.letzte_aktualisierung)],
  ];
  for (const [label, wert] of felder) zeile(`${label}: ${wert}`);
  if (projekt.kurzbeschreibung) {
    y += 4;
    zeile("Kurzbeschreibung", 10, true);
    zeile(projekt.kurzbeschreibung);
  }

  abschnitt(`Meilensteine (${meilensteine.length})`);
  if (meilensteine.length === 0) zeile("Keine Meilensteine erfasst.");
  else
    for (const m of meilensteine) {
      zeile(
        `${m.erledigt ? "[erledigt]" : "[offen]"} ${m.titel} – Frist: ${datumText(m.frist)}${
          m.notiz ? ` – ${m.notiz}` : ""
        }`,
      );
    }

  abschnitt(`Dokumente (${dokumente.length})`);
  if (dokumente.length === 0) zeile("Keine Dokumente hochgeladen.");
  else
    for (const d of dokumente) {
      const groesse = d.groesse ? ` – ${Math.max(1, Math.round(d.groesse / 1024))} KB` : "";
      zeile(`${d.dateiname}${groesse} – hochgeladen am ${datumText(d.created_at)}`);
    }

  abschnitt(`Partnerkontakte (${kontakte.length})`);
  if (kontakte.length === 0) zeile("Keine Kontakte hinterlegt.");
  else
    for (const k of kontakte) {
      const teile = [k.rolle, k.email, k.telefon].filter(Boolean).join(" · ");
      zeile(`${k.name}${teile ? ` – ${teile}` : ""}`);
      if (k.notiz) zeile(`   Notiz: ${k.notiz}`, 9);
    }

  y += 12;
  zeile("Hinweis: Beispielprojekte in dieser App sind fiktiv.", 8);

  const dateiname = berichtDateiname(projekt.titel);
  return { doc, dateiname };
}

/** Erzeugt den Partnerbericht als PDF und startet den Download im Browser. */
export async function projektBerichtExportieren(daten: BerichtDaten): Promise<string> {
  const { doc, dateiname } = await berichtErzeugen(daten);
  doc.save(dateiname);
  return dateiname;
}

/** Erzeugt den Partnerbericht als PDF-Datei, z. B. zum Ablegen bei den Projektdokumenten. */
export async function berichtPdfDatei(daten: BerichtDaten): Promise<File> {
  const { doc, dateiname } = await berichtErzeugen(daten);
  const blob = doc.output("blob") as Blob;
  return new File([blob], dateiname, { type: "application/pdf" });
}

export { datumText };
