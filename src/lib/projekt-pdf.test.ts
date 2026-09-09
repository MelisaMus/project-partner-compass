import { describe, expect, it } from "vitest";

import { berichtDateiname, datumText } from "@/lib/projekt-pdf";

describe("berichtDateiname", () => {
  const heute = new Date("2026-09-09T10:00:00Z");

  it("baut einen sprechenden Dateinamen", () => {
    expect(berichtDateiname("Transferwerkstatt Datenkompetenz", heute)).toBe(
      "partnerbericht-transferwerkstatt-datenkompetenz-2026-09-09.pdf",
    );
  });

  it("ersetzt Umlaute und Sonderzeichen", () => {
    expect(berichtDateiname("Förderprojekt: Grün & Stadt", heute)).toBe(
      "partnerbericht-foerderprojekt-gruen-stadt-2026-09-09.pdf",
    );
  });

  it("nutzt einen Ersatznamen bei leerem Titel", () => {
    expect(berichtDateiname("   ", heute)).toBe("partnerbericht-projekt-2026-09-09.pdf");
  });
});

describe("datumText", () => {
  it("formatiert Datum und leere Werte", () => {
    expect(datumText("2026-09-14")).toBe("14.09.2026");
    expect(datumText(null)).toBe("–");
    expect(datumText("keine-zeit")).toBe("–");
  });
});
