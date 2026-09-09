import { describe, expect, it } from "vitest";

import { fristAmpel, fristLabel, hatFristInnerhalb, tageBisFrist } from "./fristen";

const heute = new Date("2027-03-01T09:30:00Z");

describe("tageBisFrist", () => {
  it("zählt kalendarische Tage", () => {
    expect(tageBisFrist("2027-03-11", heute)).toBe(10);
    expect(tageBisFrist("2027-03-01", heute)).toBe(0);
    expect(tageBisFrist("2027-02-25", heute)).toBe(-4);
  });

  it("gibt null für fehlende oder ungültige Daten", () => {
    expect(tageBisFrist(null, heute)).toBeNull();
    expect(tageBisFrist("", heute)).toBeNull();
    expect(tageBisFrist("keindatum", heute)).toBeNull();
  });
});

describe("fristAmpel", () => {
  it("grün bei mehr als vier Wochen", () => {
    expect(fristAmpel("2027-03-30", heute)).toBe("gruen");
    expect(fristAmpel("2027-12-31", heute)).toBe("gruen");
  });

  it("gelb zwischen einer und vier Wochen", () => {
    expect(fristAmpel("2027-03-08", heute)).toBe("gelb");
    expect(fristAmpel("2027-03-29", heute)).toBe("gelb");
  });

  it("rot bei weniger als einer Woche und bei Überfälligkeit", () => {
    expect(fristAmpel("2027-03-07", heute)).toBe("rot");
    expect(fristAmpel("2027-03-01", heute)).toBe("rot");
    expect(fristAmpel("2027-02-01", heute)).toBe("rot");
  });

  it("keine ohne Datum", () => {
    expect(fristAmpel(null, heute)).toBe("keine");
  });
});

describe("fristLabel", () => {
  it("beschreibt die Frist in Worten", () => {
    expect(fristLabel(null, heute)).toBe("Keine Frist");
    expect(fristLabel("2027-03-01", heute)).toBe("Frist heute");
    expect(fristLabel("2027-03-02", heute)).toBe("Frist morgen");
    expect(fristLabel("2027-03-05", heute)).toBe("in 4 Tagen");
    expect(fristLabel("2027-02-27", heute)).toBe("2 Tage überfällig");
  });
});

describe("hatFristInnerhalb", () => {
  it("erfasst Fristen im Fenster inklusive überfälliger", () => {
    expect(hatFristInnerhalb("2027-03-10", 14, heute)).toBe(true);
    expect(hatFristInnerhalb("2027-02-01", 14, heute)).toBe(true);
    expect(hatFristInnerhalb("2027-04-10", 14, heute)).toBe(false);
    expect(hatFristInnerhalb(null, 14, heute)).toBe(false);
  });
});
