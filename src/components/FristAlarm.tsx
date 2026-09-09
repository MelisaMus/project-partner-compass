import { AlarmClock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { WARN_FARBEN, useAlarmEinstellungen } from "@/lib/alarm-einstellungen";
import { dringendeFristen, fristLabel } from "@/lib/fristen";
import type { Projekt } from "@/lib/projekte";

type Props = {
  projekte: readonly Projekt[];
  onKarteOeffnen?: (projekt: Projekt) => void;
};

/**
 * Alarm für Fristen, die überfällig sind oder innerhalb der eingestellten Vorlaufzeit fällig werden.
 * Vorlaufzeit und Warnfarbe kommen aus den Alarm-Einstellungen (Reiter "Fristen").
 */
export function FristAlarm({ projekte, onKarteOeffnen }: Props) {
  const [jetzt, setJetzt] = useState(() => new Date());
  const [einstellungen] = useAlarmEinstellungen();
  const gemeldet = useRef<Set<string>>(new Set());
  const farbe = WARN_FARBEN[einstellungen.farbe];

  useEffect(() => {
    const timer = window.setInterval(() => setJetzt(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dringend = dringendeFristen(projekte, jetzt, einstellungen.tageFenster);

  useEffect(() => {
    for (const karte of dringend) {
      const schluessel = `${karte.id}:${karte.naechste_frist ?? ""}:${einstellungen.tageFenster}`;
      if (gemeldet.current.has(schluessel)) continue;
      gemeldet.current.add(schluessel);
      toast.warning(`Frist bald fällig: ${karte.titel}`, {
        description: `${karte.partnerorganisation || "Partner offen"} · ${fristLabel(karte.naechste_frist, jetzt)}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dringend.map((k) => `${k.id}:${k.naechste_frist}`).join("|"), einstellungen.tageFenster]);

  if (dringend.length === 0) return null;

  return (
    <section aria-live="polite" className={`rounded-xl border ${farbe.rahmen} ${farbe.flaeche} p-4`}>
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <AlarmClock className="size-4" aria-hidden />
        Frist-Alarm: {dringend.length} {dringend.length === 1 ? "Projekt" : "Projekte"} mit Frist in
        weniger als {einstellungen.tageFenster} {einstellungen.tageFenster === 1 ? "Tag" : "Tagen"}
      </h2>
      <ul className="mt-3 space-y-2">
        {dringend.map((karte) => (
          <li key={karte.id}>
            <button
              type="button"
              onClick={() => onKarteOeffnen?.(karte)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-shadow hover:shadow-card"
            >
              <span>
                <span className="font-medium">{karte.titel}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {karte.partnerorganisation || "Partner offen"} · {karte.status}
                </span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${farbe.badge}`}>
                {fristLabel(karte.naechste_frist, jetzt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
