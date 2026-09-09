import { AlarmClock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ALARM_TAGE_FENSTER, dringendeFristen, fristLabel } from "@/lib/fristen";
import type { Projekt } from "@/lib/projekte";

type Props = {
  projekte: readonly Projekt[];
  onKarteOeffnen?: (projekt: Projekt) => void;
};

/**
 * Alarm für Fristen, die überfällig sind oder in weniger als sieben Tagen fällig werden.
 * Aktualisiert sich jede Minute (Datumswechsel) und bei neuen bzw. geänderten Kartendaten.
 */
export function FristAlarm({ projekte, onKarteOeffnen }: Props) {
  const [jetzt, setJetzt] = useState(() => new Date());
  const gemeldet = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setInterval(() => setJetzt(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dringend = dringendeFristen(projekte, jetzt);

  useEffect(() => {
    for (const karte of dringend) {
      const schluessel = `${karte.id}:${karte.naechste_frist ?? ""}`;
      if (gemeldet.current.has(schluessel)) continue;
      gemeldet.current.add(schluessel);
      toast.warning(`Frist bald fällig: ${karte.titel}`, {
        description: `${karte.partnerorganisation || "Partner offen"} · ${fristLabel(karte.naechste_frist, jetzt)}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dringend.map((k) => `${k.id}:${k.naechste_frist}`).join("|")]);

  if (dringend.length === 0) return null;

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-ampel-rot bg-ampel-rot/10 p-4"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <AlarmClock className="size-4" aria-hidden />
        Frist-Alarm: {dringend.length} {dringend.length === 1 ? "Projekt" : "Projekte"} mit Frist in
        weniger als {ALARM_TAGE_FENSTER} Tagen
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
              <span className="rounded-full bg-ampel-rot px-2 py-0.5 text-[11px] font-medium text-ampel-rot-foreground">
                {fristLabel(karte.naechste_frist, jetzt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
