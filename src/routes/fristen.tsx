import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlarmClock } from "lucide-react";
import { useEffect, useState } from "react";

import { FristAlarm } from "@/components/FristAlarm";
import { Reiter } from "@/components/Reiter";
import { ALARM_TAGE_FENSTER, fristAmpel, fristLabel, tageBisFrist } from "@/lib/fristen";
import { meilensteineQueryOptions } from "@/lib/meilensteine";
import { projekteQueryOptions } from "@/lib/projekte";

const AMPEL_KLASSEN: Record<string, string> = {
  gruen: "bg-ampel-gruen text-ampel-gruen-foreground",
  gelb: "bg-ampel-gelb text-ampel-gelb-foreground",
  rot: "bg-ampel-rot text-ampel-rot-foreground",
  keine: "bg-secondary text-secondary-foreground",
};

export const Route = createFileRoute("/fristen")({
  head: () => ({
    meta: [
      { title: "Frist-Alarm – Project Partner Compass" },
      {
        name: "description",
        content:
          "Alle überfälligen und bald fälligen Fristen der Teilprojekte und Meilensteine automatisch im Blick.",
      },
      { property: "og:title", content: "Frist-Alarm – Project Partner Compass" },
      {
        property: "og:description",
        content: "Überfällige und bald fällige Fristen aus Projekten und Meilensteinen auf einer Seite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FristenSeite,
});

function FristenSeite() {
  const { data: projekte = [], isLoading } = useQuery(projekteQueryOptions);
  const { data: meilensteine = [] } = useQuery(meilensteineQueryOptions);
  const [jetzt, setJetzt] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setJetzt(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dringendeMeilensteine = meilensteine
    .filter((m) => {
      if (m.erledigt || !m.frist) return false;
      const tage = tageBisFrist(m.frist, jetzt);
      return tage !== null && tage < ALARM_TAGE_FENSTER;
    })
    .sort((a, b) => (a.frist ?? "").localeCompare(b.frist ?? ""));

  const projektTitel = (id: string) => projekte.find((p) => p.id === id)?.titel ?? "Projekt";

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-ampel-rot text-ampel-rot-foreground">
              <AlarmClock className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Frist-Alarm</h1>
              <p className="text-sm text-muted-foreground">
                Überfällige und in weniger als {ALARM_TAGE_FENSTER} Tagen fällige Fristen –
                aktualisiert sich automatisch
              </p>
            </div>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-4 px-6 py-6">
        {isLoading ? <p className="text-sm text-muted-foreground">Lädt…</p> : null}

        <FristAlarm projekte={projekte} />

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Meilensteine mit naher Frist</h2>
          {dringendeMeilensteine.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Keine Meilensteine in den nächsten {ALARM_TAGE_FENSTER} Tagen fällig.
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

        <p className="text-xs text-muted-foreground">
          Fragen zu einzelnen Projekten beantwortet der{" "}
          <Link to="/chat" className="text-primary hover:underline">
            Chat
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
