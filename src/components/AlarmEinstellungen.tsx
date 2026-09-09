import { Settings2 } from "lucide-react";

import {
  ALARM_TAGE_MAX,
  ALARM_TAGE_MIN,
  WARN_FARBEN,
  type WarnFarbe,
  useAlarmEinstellungen,
} from "@/lib/alarm-einstellungen";

const FARB_SCHLUESSEL = Object.keys(WARN_FARBEN) as WarnFarbe[];

/** Einstellungen für Vorlaufzeit, Warnfarbe und E-Mail-Benachrichtigung des Frist-Alarms. */
export function AlarmEinstellungen() {
  const [einstellungen, speichern] = useAlarmEinstellungen();

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Settings2 className="size-4" aria-hidden />
        Alarm-Einstellungen
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="alarm-tage" className="block text-sm font-medium">
            Alarm ab … Tagen vor der Frist
          </label>
          <input
            id="alarm-tage"
            type="number"
            min={ALARM_TAGE_MIN}
            max={ALARM_TAGE_MAX}
            value={einstellungen.tageFenster}
            onChange={(e) => speichern({ tageFenster: Number(e.target.value) })}
            className="mt-1 w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Gilt für Board, Übersicht und diesen Reiter ({ALARM_TAGE_MIN}–{ALARM_TAGE_MAX} Tage).
          </p>
        </div>

        <div>
          <span className="block text-sm font-medium">Warnfarbe</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {FARB_SCHLUESSEL.map((schluessel) => {
              const farbe = WARN_FARBEN[schluessel];
              const aktiv = einstellungen.farbe === schluessel;
              return (
                <button
                  key={schluessel}
                  type="button"
                  aria-pressed={aktiv}
                  onClick={() => speichern({ farbe: schluessel })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    aktiv ? "border-primary bg-surface font-medium" : "border-border hover:bg-surface"
                  }`}
                >
                  <span
                    aria-hidden
                    className="size-3 rounded-full"
                    style={{ backgroundColor: farbe.punkt }}
                  />
                  {farbe.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-surface p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={einstellungen.emailAktiv}
            onChange={(e) => speichern({ emailAktiv: e.target.checked })}
            className="size-4 accent-[var(--color-primary)]"
          />
          Automatische E-Mail-Benachrichtigung
        </label>
        <div className="mt-2">
          <label htmlFor="alarm-email" className="block text-xs text-muted-foreground">
            Empfängeradresse
          </label>
          <input
            id="alarm-email"
            type="email"
            value={einstellungen.emailAdresse}
            onChange={(e) => speichern({ emailAdresse: e.target.value })}
            placeholder="name@organisation.de"
            className="mt-1 w-full max-w-sm rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Der Versand startet, sobald eine eigene Absender-Domain für E-Mails eingerichtet ist.
          Vorlaufzeit und Empfänger sind bereits gespeichert.
        </p>
      </div>
    </section>
  );
}
