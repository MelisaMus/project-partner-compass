import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { boardFrage } from "@/lib/chat.functions";

const BEISPIELFRAGEN = [
  "Welche Projekte haben in den nächsten vier Wochen eine Frist?",
  "Welche Projekte hängen noch in der Anbahnungsphase fest?",
  "Wo steht eine Berichtspflicht an?",
];

type Nachricht = { rolle: "frage" | "antwort"; text: string };

export function ChatPanel() {
  const frageStellen = useServerFn(boardFrage);
  const [eingabe, setEingabe] = useState("");
  const [verlauf, setVerlauf] = useState<Nachricht[]>([]);

  const mutation = useMutation({
    mutationFn: async (frage: string) =>
      frageStellen({ data: { frage, verlauf: verlauf.slice(-10) } }),
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
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="size-4 text-accent" aria-hidden />
        Status abfragen
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Fragen zum aktuellen Stand – beantwortet aus den Karten dieses Boards.
      </p>

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
            Prüfe die Board-Daten…
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
