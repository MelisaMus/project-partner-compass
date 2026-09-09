import { tageBisFrist } from "@/lib/fristen";

export type Projektsituation = {
  gesamt: number;
  laufend: number;
  abgeschlossen: number;
  ueberfaellig: number;
};

/**
 * Kennzahlen für die Projektsituation-Kachel.
 * "laufend" = Status "Laufend"; "überfällig" = Frist in der Vergangenheit
 * und Projekt nicht abgeschlossen.
 */
export function projektsituation<T extends { status: string; naechste_frist: string | null }>(
  projekte: readonly T[],
  heute: Date = new Date(),
): Projektsituation {
  let laufend = 0;
  let abgeschlossen = 0;
  let ueberfaellig = 0;

  for (const projekt of projekte) {
    if (projekt.status === "Laufend") laufend += 1;
    if (projekt.status === "Abgeschlossen") {
      abgeschlossen += 1;
      continue;
    }
    const tage = tageBisFrist(projekt.naechste_frist, heute);
    if (tage !== null && tage < 0) ueberfaellig += 1;
  }

  return { gesamt: projekte.length, laufend, abgeschlossen, ueberfaellig };
}
