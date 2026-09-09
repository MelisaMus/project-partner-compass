import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { boardFrage } from "@/lib/chat.functions";
import { STATUS_SPALTEN, projekteQueryOptions } from "@/lib/projekte";

const FRIST_OPTIONEN = [
  { wert: "7", label: "Frist in 7 Tagen" },
  { wert: "14", label: "Frist in 14 Tagen" },
  { wert: "28", label: "Frist in 4 Wochen" },
];

const auswahlKlasse =
  "rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-surface-foreground";

function tageBis(datum: string): number {
  const ziel = new Date(`${datum.slice(0, 10)}T00:00:00Z`);
  const heute = new Date();
  return Math.round(
    (Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth(), ziel.getUTCDate()) -
      Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), heute.getUTCDate())) /
      86400000,
  );
}

const BEISPIELFRAGEN = [
  "Welche Projekte haben in den nächsten vier Wochen eine Frist?",
  "Welche Projekte hängen noch in der Anbahnungsphase fest?",
  "Wo steht eine Berichtspflicht an?",
];

type Nachricht = { rolle: "frage" | "antwort"; text: string };

const SPEICHER_SCHLUESSEL = "partner-compass-chat-verlauf";

export function ChatPanel() {
  const frageStellen = useServerFn(boardFrage);
  const [eingabe, setEingabe] = useState("");
  const [verlauf, setVerlauf] = useState<Nachricht[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [status, setStatus] = useState("");
  const [partner, setPartner] = useState("");
  const [fristTage, setFristTage] = useState("");

  const { data: projekte } = useQuery(projekteQueryOptions);

  const partnerListe = Array.from(
    new Set((projekte ?? []).map((p) => p.partnerorganisation).filter((v): v is string => !!v)),
  ).sort((a, b) => a.localeCompare(b, "de"));

  const filterAktiv = Boolean(status || partner || fristTage);
  const treffer = (projekte ?? []).filter((p) => {
    if (status && p.status !== status) return false;
    if (partner && (p.partnerorganisation ?? "") !== partner) return false;
    if (fristTage) {
      if (!p.naechste_frist) return false;
      if (tageBis(p.naechste_frist) > Number(fristTage)) return false;
    }
    return true;
  });

  // Gespräch bleibt beim Wechsel zwischen Board, Übersicht und Chat erhalten.
  useEffect(() => {
    try {
      const roh = window.localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (roh) setVerlauf(JSON.parse(roh) as Nachricht[]);
    } catch {
      /* ignorieren */
    }
    setGeladen(true);
  }, []);

  useEffect(() => {
    if (!geladen) return;
    try {
      window.localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(verlauf.slice(-40)));
    } catch {
      /* ignorieren */
    }
  }, [verlauf, geladen]);




  const mutation = useMutation({
    mutationFn: async (frage: string) =>
      frageStellen({
        data: {
          frage,
          verlauf: verlauf.slice(-10),
          filter: {
            status: status || null,
            partner: partner || null,
            fristTage: fristTage ? Number(fristTage) : null,
          },
        },
      }),
    onSuccess: (ergebnis) => {
      setVerlauf((alt) => [...alt, { rolle: "antwort", text: ergebnis.antwort }]);
    },
    onError: (fehler: Error) => {
      setVerlauf((alt) => [
        ...alt,
        { rolle: "antwort", text: fehler.message || "Die Anfrage hat nicht funktioniert." },
      ]);
    },
  });

  const absenden = (frage: string) => {
    const text = frage.trim();
    if (!text || mutation.isPending) return;
    setVerlauf((alt) => [...alt, { rolle: "frage", text }]);
    setEingabe("");
    mutation.mutate(text);
  };

  return (
    <section
      aria-label="Statusabfrage"
      className="rounded-xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-4 text-accent" aria-hidden />
          Status abfragen
        </h2>
        {verlauf.length > 0 ? (
          <button
            type="button"
            onClick={() => setVerlauf([])}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Gespräch zurücksetzen
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Fragen zum aktuellen Stand – beantwortet von einer KI auf Basis der Karten dieses Boards,
        Rückfragen im Gespräch möglich.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          aria-label="Status filtern"
          className={auswahlKlasse}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Alle Status</option>
          {STATUS_SPALTEN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Partnerorganisation filtern"
          className={auswahlKlasse}
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
        >
          <option value="">Alle Partner</option>
          {partnerListe.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          aria-label="Frist filtern"
          className={auswahlKlasse}
          value={fristTage}
          onChange={(e) => setFristTage(e.target.value)}
        >
          <option value="">Alle Fristen</option>
          {FRIST_OPTIONEN.map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.label}
            </option>
          ))}
        </select>
        {filterAktiv ? (
          <>
            <span className="text-xs text-muted-foreground">
              {treffer.length} von {(projekte ?? []).length} Projekten
            </span>
            <button
              type="button"
              onClick={() => {
                setStatus("");
                setPartner("");
                setFristTage("");
              }}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Filter zurücksetzen
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {verlauf.map((n, i) => (
          <div
            key={i}
            className={
              n.rolle === "frage"
                ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[95%] space-y-2 rounded-lg bg-surface px-3 py-2 text-sm text-surface-foreground [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold"
            }
          >
            {n.rolle === "antwort" ? <Markdown>{n.text}</Markdown> : n.text}
          </div>
        ))}
        {mutation.isPending ? (
          <div className="max-w-[95%] rounded-lg bg-surface px-3 py-2 text-sm text-muted-foreground">
            Denkt nach…
          </div>
        ) : null}
      </div>

      {verlauf.length === 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {BEISPIELFRAGEN.map((frage) => (
            <button
              key={frage}
              type="button"
              onClick={() => absenden(frage)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-surface-foreground transition-colors hover:bg-secondary"
            >
              {frage}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          absenden(eingabe);
        }}
      >
        <Textarea
          rows={2}
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder="z. B. Wie ist der Status von Beispielverein für Nachbarschaftshilfe e.V.?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              absenden(eingabe);
            }
          }}
        />
        <Button type="submit" disabled={mutation.isPending || !eingabe.trim()} className="self-end">
          Frage senden
        </Button>
      </form>
    </section>
  );
}
