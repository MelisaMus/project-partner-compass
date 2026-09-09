import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AlarmEinstellungen } from "@/components/AlarmEinstellungen";
import { FristAlarm } from "@/components/FristAlarm";
import { useAlarmEinstellungen } from "@/lib/alarm-einstellungen";
import { AMPEL_KLASSEN } from "@/lib/darstellung";
import { fristAmpel, fristLabel, tageBisFrist } from "@/lib/fristen";
import { meilensteineQueryOptions } from "@/lib/meilensteine";
import { projekteQueryOptions } from "@/lib/projekte";

/**
 * Frist-Alarm: Einstellungen, überfällige Projektfristen und Meilensteine mit
 * naher Frist. Aktualisiert sich minütlich und über die geteilten Abfragen.
 */
export function FristAlarmPanel() {
  const { data: projekte = [] } = useQuery(projekteQueryOptions);
  const { data: meilensteine = [] } = useQuery(meilensteineQueryOptions);
  const [jetzt, setJetzt] = useState(() => new Date());
  const [einstellungen] = useAlarmEinstellungen();

  useEffect(() => {
    const timer = window.setInterval(() => setJetzt(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dringendeMeilensteine = meilensteine
    .filter((m) => {
      if (m.erledigt || !m.frist) return false;
      const tage = tageBisFrist(m.frist, jetzt);
      return tage !== null && tage < einstellungen.tageFenster;
    })
    .sort((a, b) => (a.frist ?? "").localeCompare(b.frist ?? ""));

  const projektTitel = (id: string) => projekte.find((p) => p.id === id)?.titel ?? "Projekt";

  return (
    <div className="space-y-4">
      <AlarmEinstellungen />

      <FristAlarm projekte={projekte} />

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Meilensteine mit naher Frist</h3>
        {dringendeMeilensteine.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Keine Meilensteine in den nächsten {einstellungen.tageFenster} Tagen fällig.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dringendeMeilensteine.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.titel}</span>
                  <span className="block text-xs text-muted-foreground">
                    {projektTitel(m.projekt_id)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${AMPEL_KLASSEN[fristAmpel(m.frist, jetzt)]}`}
                >
                  {fristLabel(m.frist, jetzt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
