import { Activity, AlertTriangle, CheckCircle2, LayoutGrid } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { projektsituation } from "@/lib/situation";
import type { Projekt } from "@/lib/projekte";

function Wert({
  icon,
  wert,
  label,
  klasse,
}: {
  icon: React.ReactNode;
  wert: number;
  label: string;
  klasse: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <span className={`grid size-9 place-items-center rounded-md ${klasse}`}>{icon}</span>
      <span>
        <span className="block text-xl font-semibold leading-none">{wert}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

export function Projektsituation({ projekte }: { projekte: readonly Projekt[] }) {
  const [jetzt, setJetzt] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setJetzt(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const situation = useMemo(() => projektsituation(projekte, jetzt), [projekte, jetzt]);

  return (
    <section
      aria-label="Projektsituation"
      className="rounded-xl border border-border bg-card p-4 shadow-card"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Projektsituation</h2>
        <span className="text-xs text-muted-foreground">
          Stand {jetzt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – aktualisiert
          automatisch
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Wert
          icon={<LayoutGrid className="size-4" aria-hidden />}
          wert={situation.gesamt}
          label="Projekte gesamt"
          klasse="bg-secondary text-secondary-foreground"
        />
        <Wert
          icon={<Activity className="size-4" aria-hidden />}
          wert={situation.laufend}
          label="Laufend"
          klasse="bg-ampel-gruen text-ampel-gruen-foreground"
        />
        <Wert
          icon={<CheckCircle2 className="size-4" aria-hidden />}
          wert={situation.abgeschlossen}
          label="Abgeschlossen"
          klasse="bg-ampel-keine text-ampel-keine-foreground"
        />
        <Wert
          icon={<AlertTriangle className="size-4" aria-hidden />}
          wert={situation.ueberfaellig}
          label="Überfällige Fristen"
          klasse="bg-ampel-rot text-ampel-rot-foreground"
        />
      </div>
    </section>
  );
}
