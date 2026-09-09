import { useEffect, useMemo, useState } from "react";

import { projektsituation } from "@/lib/situation";
import type { Projekt } from "@/lib/projekte";

type Ton = "neutral" | "teal" | "gelb" | "rot";

const TON_KLASSEN: Record<Ton, { box: string; label: string; wert: string }> = {
  neutral: {
    box: "border-border bg-surface",
    label: "text-muted-foreground",
    wert: "text-foreground",
  },
  teal: {
    box: "border-accent/40 bg-accent/10",
    label: "text-primary",
    wert: "text-primary",
  },
  gelb: {
    box: "border-ampel-gelb bg-ampel-gelb",
    label: "text-ampel-gelb-foreground",
    wert: "text-ampel-gelb-foreground",
  },
  rot: {
    box: "border-ampel-rot bg-ampel-rot",
    label: "text-ampel-rot-foreground",
    wert: "text-ampel-rot-foreground",
  },
};

function Wert({ wert, label, ton }: { wert: number; label: string; ton: Ton }) {
  const klassen = TON_KLASSEN[ton];
  return (
    <div className={`rounded-2xl border p-4 ${klassen.box}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${klassen.label}`}>{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${klassen.wert}`}>{wert}</p>
    </div>
  );
}

/** Eine Kennzahlen-Leiste für alle wichtigen Zahlen; aktualisiert sich minütlich. */
export function Projektsituation({ projekte }: { projekte: readonly Projekt[] }) {
  const [jetzt, setJetzt] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setJetzt(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const situation = useMemo(() => projektsituation(projekte, jetzt), [projekte, jetzt]);

  return (
    <section aria-label="Projektsituation" className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Wert wert={situation.gesamt} label="Projekte gesamt" ton="neutral" />
        <Wert wert={situation.laufend} label="Laufend" ton="neutral" />
        <Wert wert={situation.fristZweiWochen} label="Frist in 2 Wochen" ton="teal" />
        <Wert wert={situation.berichtspflicht} label="Berichtspflicht" ton="gelb" />
        <Wert wert={situation.ueberfaellig} label="Überfällig" ton="rot" />
      </div>
      <p className="text-xs text-muted-foreground">
        Stand {jetzt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} – aktualisiert
        automatisch · {situation.abgeschlossen} abgeschlossen
      </p>
    </section>
  );
}
