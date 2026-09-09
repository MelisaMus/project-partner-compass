import { hatFristInnerhalb, tageBisFrist } from "@/lib/fristen";

export type Projektsituation = {
  gesamt: number;
  laufend: number;
  abgeschlossen: number;
  ueberfaellig: number;
  fristZweiWochen: number;
  berichtspflicht: number;
};

/**
 * Kennzahlen für die Kennzahlen-Leiste.
 * "laufend" = Status "Laufend"; "überfällig" = Frist in der Vergangenheit
 * und Projekt nicht abgeschlossen; "fristZweiWochen" = Frist innerhalb von 14 Tagen.
 */
export function projektsituation<T extends { status: string; naechste_frist: string | null }>(
  projekte: readonly T[],
  heute: Date = new Date(),
): Projektsituation {
  let laufend = 0;
  let abgeschlossen = 0;
  let ueberfaellig = 0;
  let fristZweiWochen = 0;
  let berichtspflicht = 0;

  for (const projekt of projekte) {
    if (projekt.status === "Laufend") laufend += 1;
    if (projekt.status === "Berichtspflicht fällig") berichtspflicht += 1;
    if (hatFristInnerhalb(projekt.naechste_frist, 14, heute)) fristZweiWochen += 1;
    if (projekt.status === "Abgeschlossen") {
      abgeschlossen += 1;
      continue;
    }
    const tage = tageBisFrist(projekt.naechste_frist, heute);
    if (tage !== null && tage < 0) ueberfaellig += 1;
  }

  return { gesamt: projekte.length, laufend, abgeschlossen, ueberfaellig, fristZweiWochen, berichtspflicht };
}
