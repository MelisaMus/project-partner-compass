import { describe, expect, it } from "vitest";

import { projektsituation } from "@/lib/situation";

const heute = new Date("2026-09-09T00:00:00Z");

describe("projektsituation", () => {
  it("zählt gesamt, laufend, abgeschlossen und überfällig", () => {
    const situation = projektsituation(
      [
        { status: "Laufend", naechste_frist: "2026-09-01" },
        { status: "Laufend", naechste_frist: "2026-10-01" },
        { status: "Anbahnung", naechste_frist: null },
        { status: "Berichtspflicht fällig", naechste_frist: "2026-09-08" },
        { status: "Abgeschlossen", naechste_frist: "2026-01-01" },
      ],
      heute,
    );
    expect(situation).toEqual({
      gesamt: 5,
      laufend: 2,
      abgeschlossen: 1,
      ueberfaellig: 2,
      fristZweiWochen: 3,
      berichtspflicht: 1,
    });
  });

  it("zählt die heutige Frist nicht als überfällig", () => {
    const situation = projektsituation([{ status: "Laufend", naechste_frist: "2026-09-09" }], heute);
    expect(situation.ueberfaellig).toBe(0);
  });

  it("liefert Nullen für eine leere Liste", () => {
    expect(projektsituation([], heute)).toEqual({
      gesamt: 0,
      laufend: 0,
      abgeschlossen: 0,
      ueberfaellig: 0,
      fristZweiWochen: 0,
      berichtspflicht: 0,
    });
  });
});
