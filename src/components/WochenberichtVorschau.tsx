import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Mail } from "lucide-react";
import { useMemo, useState } from "react";

import { useAlarmEinstellungen } from "@/lib/alarm-einstellungen";
import { AMPEL_KLASSEN, datumText } from "@/lib/darstellung";
import { fristAmpel, fristLabel } from "@/lib/fristen";
import { meilensteineQueryOptions } from "@/lib/meilensteine";
import { projekteQueryOptions } from "@/lib/projekte";
import { wochenberichtErstellen, type BerichtGruppe } from "@/lib/wochenbericht";

const GRUPPIERUNGEN = [
  { schluessel: "status", label: "Nach Status" },
  { schluessel: "partner", label: "Nach Partnerorganisation" },
  { schluessel: "frist", label: "Nach Frist" },
] as const;

type Gruppierung = (typeof GRUPPIERUNGEN)[number]["schluessel"];

/** Vorschau des Berichts, der montags morgens verschickt werden soll. */
export function WochenberichtVorschau() {
  const [gruppierung, setGruppierung] = useState<Gruppierung>("status");
  const [einstellungen] = useAlarmEinstellungen();
  const projekte = useQuery(projekteQueryOptions);
  const meilensteine = useQuery(meilensteineQueryOptions);

  const bericht = useMemo(
    () => wochenberichtErstellen(projekte.data ?? [], meilensteine.data ?? []),
    [projekte.data, meilensteine.data],
  );

  const gruppen: BerichtGruppe[] =
    gruppierung === "status"
      ? bericht.nachStatus
      : gruppierung === "partner"
        ? bericht.nachPartner
        : bericht.nachFrist;

  const versandText = bericht.versandAm.toLocaleString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Projekte im Bericht
          </p>
          <p className="mt-1 text-2xl font-semibold">{bericht.anzahlProjekte}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Offene Meilensteine
          </p>
          <p className="mt-1 text-2xl font-semibold">{bericht.anzahlOffeneMeilensteine}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden /> Geplanter Versand
          </p>
          <p className="mt-1 text-sm font-medium">{versandText}</p>
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">
        <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {einstellungen.emailAdresse
            ? `Empfänger für den Versand: ${einstellungen.emailAdresse}.`
            : "Noch keine Empfängeradresse hinterlegt."}{" "}
          Der automatische Versand startet, sobald eine eigene Absenderadresse eingerichtet ist.
          Diese Vorschau zeigt jederzeit den aktuellen Stand.
        </span>
      </p>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
        {GRUPPIERUNGEN.map((option) => (
          <button
            key={option.schluessel}
            type="button"
            onClick={() => setGruppierung(option.schluessel)}
            aria-pressed={gruppierung === option.schluessel}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              gruppierung === option.schluessel
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {projekte.isLoading || meilensteine.isLoading ? (
        <p className="text-sm text-muted-foreground">Bericht wird zusammengestellt …</p>
      ) : projekte.isError ? (
        <p className="text-sm text-ampel-rot-foreground">Projekte konnten nicht geladen werden.</p>
      ) : gruppen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Projekte vorhanden.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {gruppen.map((gruppe) => (
            <section key={gruppe.titel} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {gruppe.titel} <span className="font-normal">({gruppe.eintraege.length})</span>
              </h3>
              <ul className="flex flex-col gap-2">
                {gruppe.eintraege.map(({ projekt, fristText, meilensteine: eigene }) => (
                  <li key={projekt.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">{projekt.titel}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${AMPEL_KLASSEN[fristAmpel(projekt.naechste_frist)]}`}
                      >
                        {datumText(projekt.naechste_frist)} · {fristText}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {projekt.partnerorganisation?.trim() || "Ohne Partnerangabe"} · {projekt.status}
                    </p>
                    {eigene.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
                        {eigene.map((m) => (
                          <li
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span className={m.erledigt ? "text-muted-foreground line-through" : ""}>
                              {m.titel}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {datumText(m.frist)}
                                {m.frist ? ` · ${fristLabel(m.frist)}` : ""}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  m.erledigt
                                    ? "bg-secondary text-secondary-foreground"
                                    : AMPEL_KLASSEN[fristAmpel(m.frist)]
                                }`}
                              >
                                {m.erledigt ? "Erledigt" : "Offen"}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
