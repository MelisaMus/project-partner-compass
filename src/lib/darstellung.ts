import { fristLabel, type FristAmpel } from "@/lib/fristen";

/** Einheitliche Ampelfarben für Fristen (Board, Übersicht, Termine, Berichte). */
export const AMPEL_KLASSEN: Record<FristAmpel, string> = {
  gruen: "bg-ampel-gruen text-ampel-gruen-foreground",
  gelb: "bg-ampel-gelb text-ampel-gelb-foreground",
  rot: "bg-ampel-rot text-ampel-rot-foreground",
  keine: "bg-ampel-keine text-ampel-keine-foreground",
};

/**
 * Datum als "TT.MM.JJJJ".
 * Datumsangaben der Datenbank sind reine Kalendertage, daher wird UTC gelesen,
 * damit sich der Tag nicht durch die Zeitzone verschiebt.
 */
export function datumText(wert: string | null | undefined, leer = "–"): string {
  if (!wert) return leer;
  const datum = new Date(`${wert.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(datum.getTime())) return leer;
  return datum.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Frist als "TT.MM.JJJJ · in 3 Tagen" bzw. nur das Label, wenn keine Frist gesetzt ist. */
export function fristText(frist: string | null | undefined): string {
  if (!frist) return fristLabel(frist ?? null);
  return `${datumText(frist)} · ${fristLabel(frist)}`;
}
