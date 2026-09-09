import { describe, expect, it } from "vitest";

import type { Meilenstein } from "@/lib/meilensteine";
import type { Projekt } from "@/lib/projekte";
import { naechsterVersand, wochenberichtErstellen } from "@/lib/wochenbericht";

function projekt(teil: Partial<Projekt>): Projekt {
  return {
    id: teil.id ?? "1",
    titel: teil.titel ?? "Projekt",
    themenbereich: null,
    partnerorganisation: teil.partnerorganisation ?? "Partner A",
    partner_typ: "Sonstige",
    verantwortliche_person: null,
    status: teil.status ?? "Laufend",
    naechste_frist: teil.naechste_frist ?? null,
    foerdermittelbezug: null,
    kurzbeschreibung: null,
    board_id: null,
    letzte_aktualisierung: "2026-09-01T00:00:00Z",
  };
}

function meilenstein(teil: Partial<Meilenstein>): Meilenstein {
  return {
    id: teil.id ?? "m1",
    projekt_id: teil.projekt_id ?? "1",
    titel: teil.titel ?? "Kick-off",
    frist: teil.frist ?? null,
    notiz: null,
    erledigt: teil.erledigt ?? false,
    sortierung: 0,
    created_at: "2026-09-01T00:00:00Z",
    letzte_aktualisierung: "2026-09-01T00:00:00Z",
  };
}

describe("naechsterVersand", () => {
  it("wählt den kommenden Montag 07:00", () => {
    const versand = naechsterVersand(new Date("2026-09-09T12:00:00"));
    expect(versand.getDay()).toBe(1);
    expect(versand.getHours()).toBe(7);
    expect(versand.getDate()).toBe(14);
  });

  it("springt an einem Montagnachmittag auf den nächsten Montag", () => {
    const versand = naechsterVersand(new Date("2026-09-14T12:00:00"));
    expect(versand.getDate()).toBe(21);
  });

  it("bleibt am Montag vor 07:00 bei diesem Tag", () => {
    const versand = naechsterVersand(new Date("2026-09-14T05:00:00"));
    expect(versand.getDate()).toBe(14);
  });
});

describe("wochenberichtErstellen", () => {
  const heute = new Date("2026-09-09T00:00:00Z");

  it("gruppiert nach Status, Partner und Frist", () => {
    const bericht = wochenberichtErstellen(
      [
        projekt({ id: "1", titel: "A", status: "Laufend", naechste_frist: "2026-09-11" }),
        projekt({ id: "2", titel: "B", status: "Anbahnung", partnerorganisation: "Partner B" }),
      ],
      [],
      heute,
    );
    expect(bericht.anzahlProjekte).toBe(2);
    expect(bericht.nachStatus.map((g) => g.titel)).toEqual(["Anbahnung", "Laufend"]);
    expect(bericht.nachPartner.map((g) => g.titel)).toEqual(["Partner A", "Partner B"]);
    expect(bericht.nachFrist.map((g) => g.titel)).toEqual(["Diese Woche", "Ohne Frist"]);
  });

  it("hängt Meilensteine an ihr Projekt und zählt offene", () => {
    const bericht = wochenberichtErstellen(
      [projekt({ id: "1" })],
      [
        meilenstein({ id: "m1", frist: "2026-10-01", erledigt: true }),
        meilenstein({ id: "m2", frist: "2026-09-20" }),
      ],
      heute,
    );
    expect(bericht.anzahlOffeneMeilensteine).toBe(1);
    expect(bericht.nachStatus[0].eintraege[0].meilensteine.map((m) => m.id)).toEqual(["m2", "m1"]);
  });
});
