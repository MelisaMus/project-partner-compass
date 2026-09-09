export type FristAmpel = "gruen" | "gelb" | "rot" | "keine";

export const MS_PRO_TAG = 24 * 60 * 60 * 1000;

/**
 * Tage bis zur Frist (kalendarisch, UTC-normalisiert).
 * Negative Werte = Frist liegt in der Vergangenheit.
 */
export function tageBisFrist(frist: string | Date | null | undefined, heute: Date = new Date()): number | null {
  if (!frist) return null;
  const ziel = typeof frist === "string" ? new Date(`${frist.slice(0, 10)}T00:00:00Z`) : frist;
  if (Number.isNaN(ziel.getTime())) return null;
  const zielTag = Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth(), ziel.getUTCDate());
  const heuteTag = Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), heute.getUTCDate());
  return Math.round((zielTag - heuteTag) / MS_PRO_TAG);
}

/**
 * Fristen-Ampel:
 * - gruen: mehr als 4 Wochen (> 28 Tage)
 * - gelb: 1 bis 4 Wochen (7 bis 28 Tage)
 * - rot: weniger als 1 Woche (< 7 Tage), auch überfällig
 * - keine: kein Datum gesetzt
 */
export function fristAmpel(frist: string | Date | null | undefined, heute: Date = new Date()): FristAmpel {
  const tage = tageBisFrist(frist, heute);
  if (tage === null) return "keine";
  if (tage < 7) return "rot";
  if (tage <= 28) return "gelb";
  return "gruen";
}

export function fristLabel(frist: string | Date | null | undefined, heute: Date = new Date()): string {
  const tage = tageBisFrist(frist, heute);
  if (tage === null) return "Keine Frist";
  if (tage < 0) return `${Math.abs(tage)} Tage überfällig`;
  if (tage === 0) return "Frist heute";
  if (tage === 1) return "Frist morgen";
  return `in ${tage} Tagen`;
}

export function hatFristInnerhalb(
  frist: string | Date | null | undefined,
  tageFenster: number,
  heute: Date = new Date(),
): boolean {
  const tage = tageBisFrist(frist, heute);
  return tage !== null && tage <= tageFenster;
}
