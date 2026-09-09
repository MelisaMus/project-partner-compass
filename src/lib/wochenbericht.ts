import { fristLabel, tageBisFrist } from "@/lib/fristen";
import type { Meilenstein } from "@/lib/meilensteine";
import { STATUS_SPALTEN, type Projekt } from "@/lib/projekte";

export type BerichtProjekt = {
  projekt: Projekt;
  fristText: string;
  tageBisFrist: number | null;
  meilensteine: Meilenstein[];
};

export type BerichtGruppe = {
  titel: string;
  eintraege: BerichtProjekt[];
};

export type Wochenbericht = {
  /** Geplanter Versandtermin: nächster Montag, 07:00 Ortszeit. */
  versandAm: Date;
  anzahlProjekte: number;
  anzahlOffeneMeilensteine: number;
  nachStatus: BerichtGruppe[];
  nachPartner: BerichtGruppe[];
  nachFrist: BerichtGruppe[];
};

/** Nächster Montag 07:00 – der geplante Versandzeitpunkt des Wochenberichts. */
export function naechsterVersand(jetzt: Date = new Date()): Date {
  const ziel = new Date(jetzt);
  ziel.setHours(7, 0, 0, 0);
  const tageBisMontag = (8 - ziel.getDay()) % 7;
  if (tageBisMontag === 0 && ziel.getTime() <= jetzt.getTime()) {
    ziel.setDate(ziel.getDate() + 7);
  } else {
    ziel.setDate(ziel.getDate() + tageBisMontag);
  }
  return ziel;
}

function fristGruppenTitel(tage: number | null): string {
  if (tage === null) return "Ohne Frist";
  if (tage < 0) return "Überfällig";
  if (tage < 7) return "Diese Woche";
  if (tage <= 28) return "In 1–4 Wochen";
  return "Später als 4 Wochen";
}

const FRIST_REIHENFOLGE = ["Überfällig", "Diese Woche", "In 1–4 Wochen", "Später als 4 Wochen", "Ohne Frist"];

/** Stellt den Wochenbericht aus Projekten und Meilensteinen zusammen. */
export function wochenberichtErstellen(
  projekte: readonly Projekt[],
  meilensteine: readonly Meilenstein[],
  jetzt: Date = new Date(),
): Wochenbericht {
  const eintraege: BerichtProjekt[] = projekte.map((projekt) => ({
    projekt,
    fristText: fristLabel(projekt.naechste_frist, jetzt),
    tageBisFrist: tageBisFrist(projekt.naechste_frist, jetzt),
    meilensteine: meilensteine
      .filter((m) => m.projekt_id === projekt.id)
      .slice()
      .sort((a, b) => {
        if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
        return (a.frist ?? "9999").localeCompare(b.frist ?? "9999");
      }),
  }));

  const sortiereFrist = (a: BerichtProjekt, b: BerichtProjekt) => {
    if (a.tageBisFrist === null) return b.tageBisFrist === null ? 0 : 1;
    if (b.tageBisFrist === null) return -1;
    return a.tageBisFrist - b.tageBisFrist;
  };

  const nachStatus: BerichtGruppe[] = [];
  for (const status of STATUS_SPALTEN) {
    const gruppe = eintraege.filter((e) => e.projekt.status === status).sort(sortiereFrist);
    if (gruppe.length > 0) nachStatus.push({ titel: status, eintraege: gruppe });
  }
  const sonstige = eintraege
    .filter((e) => !STATUS_SPALTEN.includes(e.projekt.status as (typeof STATUS_SPALTEN)[number]))
    .sort(sortiereFrist);
  if (sonstige.length > 0) nachStatus.push({ titel: "Ohne Status", eintraege: sonstige });

  const partnerNamen = Array.from(
    new Set(eintraege.map((e) => e.projekt.partnerorganisation?.trim() || "Ohne Partnerangabe")),
  ).sort((a, b) => a.localeCompare(b, "de"));
  const nachPartner: BerichtGruppe[] = partnerNamen.map((partner) => ({
    titel: partner,
    eintraege: eintraege
      .filter((e) => (e.projekt.partnerorganisation?.trim() || "Ohne Partnerangabe") === partner)
      .sort(sortiereFrist),
  }));

  const nachFrist: BerichtGruppe[] = FRIST_REIHENFOLGE.map((titel) => ({
    titel,
    eintraege: eintraege.filter((e) => fristGruppenTitel(e.tageBisFrist) === titel).sort(sortiereFrist),
  })).filter((gruppe) => gruppe.eintraege.length > 0);

  return {
    versandAm: naechsterVersand(jetzt),
    anzahlProjekte: projekte.length,
    anzahlOffeneMeilensteine: meilensteine.filter((m) => !m.erledigt).length,
    nachStatus,
    nachPartner,
    nachFrist,
  };
}
