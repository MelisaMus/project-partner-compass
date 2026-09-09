import { useEffect, useState } from "react";

import { ALARM_TAGE_FENSTER } from "@/lib/fristen";

export type WarnFarbe = "rot" | "orange" | "gelb" | "violett";

export type AlarmEinstellungen = {
  /** Alarm auslösen, wenn die Frist in weniger als so vielen Tagen fällig ist. */
  tageFenster: number;
  farbe: WarnFarbe;
  emailAktiv: boolean;
  emailAdresse: string;
};

export const WARN_FARBEN: Record<WarnFarbe, { label: string; rahmen: string; flaeche: string; badge: string; punkt: string }> = {
  rot: {
    label: "Rot",
    rahmen: "border-ampel-rot",
    flaeche: "bg-ampel-rot/10",
    badge: "bg-ampel-rot text-ampel-rot-foreground",
    punkt: "oklch(0.62 0.2 25)",
  },
  orange: {
    label: "Orange",
    rahmen: "border-[oklch(0.75_0.15_55)]",
    flaeche: "bg-[oklch(0.75_0.15_55)]/10",
    badge: "bg-[oklch(0.9_0.09_60)] text-[oklch(0.42_0.13_50)]",
    punkt: "oklch(0.72 0.17 55)",
  },
  gelb: {
    label: "Gelb",
    rahmen: "border-ampel-gelb",
    flaeche: "bg-ampel-gelb/20",
    badge: "bg-ampel-gelb text-ampel-gelb-foreground",
    punkt: "oklch(0.85 0.14 90)",
  },
  violett: {
    label: "Violett",
    rahmen: "border-[oklch(0.65_0.17_300)]",
    flaeche: "bg-[oklch(0.65_0.17_300)]/10",
    badge: "bg-[oklch(0.92_0.06_300)] text-[oklch(0.42_0.16_300)]",
    punkt: "oklch(0.62 0.18 300)",
  },
};

export const ALARM_TAGE_MIN = 1;
export const ALARM_TAGE_MAX = 90;

export const STANDARD_EINSTELLUNGEN: AlarmEinstellungen = {
  tageFenster: ALARM_TAGE_FENSTER,
  farbe: "rot",
  emailAktiv: false,
  emailAdresse: "",
};

const SPEICHER_SCHLUESSEL = "partner-compass-alarm-einstellungen";
const EVENT = "partner-compass-alarm-einstellungen-geaendert";

export function normalisiereEinstellungen(rohdaten: unknown): AlarmEinstellungen {
  if (!rohdaten || typeof rohdaten !== "object") return STANDARD_EINSTELLUNGEN;
  const daten = rohdaten as Partial<AlarmEinstellungen>;
  const tage = Number(daten.tageFenster);
  const farbe = daten.farbe && daten.farbe in WARN_FARBEN ? daten.farbe : STANDARD_EINSTELLUNGEN.farbe;
  return {
    tageFenster: Number.isFinite(tage)
      ? Math.min(ALARM_TAGE_MAX, Math.max(ALARM_TAGE_MIN, Math.round(tage)))
      : STANDARD_EINSTELLUNGEN.tageFenster,
    farbe,
    emailAktiv: Boolean(daten.emailAktiv),
    emailAdresse: typeof daten.emailAdresse === "string" ? daten.emailAdresse.slice(0, 200) : "",
  };
}

function lade(): AlarmEinstellungen {
  if (typeof window === "undefined") return STANDARD_EINSTELLUNGEN;
  try {
    const roh = window.localStorage.getItem(SPEICHER_SCHLUESSEL);
    return roh ? normalisiereEinstellungen(JSON.parse(roh)) : STANDARD_EINSTELLUNGEN;
  } catch {
    return STANDARD_EINSTELLUNGEN;
  }
}

/** Einstellungen des Frist-Alarms, geteilt über alle Seiten und Tabs. */
export function useAlarmEinstellungen(): [AlarmEinstellungen, (naechste: Partial<AlarmEinstellungen>) => void] {
  const [einstellungen, setEinstellungen] = useState<AlarmEinstellungen>(STANDARD_EINSTELLUNGEN);

  useEffect(() => {
    setEinstellungen(lade());
    const aktualisieren = () => setEinstellungen(lade());
    window.addEventListener(EVENT, aktualisieren);
    window.addEventListener("storage", aktualisieren);
    return () => {
      window.removeEventListener(EVENT, aktualisieren);
      window.removeEventListener("storage", aktualisieren);
    };
  }, []);

  const speichern = (teil: Partial<AlarmEinstellungen>) => {
    const naechste = normalisiereEinstellungen({ ...lade(), ...teil });
    setEinstellungen(naechste);
    try {
      window.localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(naechste));
    } catch {
      /* Speicher nicht verfügbar – Einstellung gilt für diese Sitzung */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return [einstellungen, speichern];
}
