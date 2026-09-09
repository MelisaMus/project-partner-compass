import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fristAmpel, fristLabel, type FristAmpel } from "@/lib/fristen";
import {
  meilensteinAktualisieren,
  meilensteinAnlegen,
  meilensteinLoeschen,
  type Meilenstein,
} from "@/lib/meilensteine";

const AMPEL_KLASSEN: Record<FristAmpel, string> = {
  gruen: "bg-ampel-gruen text-ampel-gruen-foreground",
  gelb: "bg-ampel-gelb text-ampel-gelb-foreground",
  rot: "bg-ampel-rot text-ampel-rot-foreground",
  keine: "bg-secondary text-secondary-foreground",
};

function datumText(frist: string | null): string {
  if (!frist) return fristLabel(frist);
  const datum = new Date(`${frist.slice(0, 10)}T00:00:00Z`).toLocaleDateString("de-DE");
  return `${datum} · ${fristLabel(frist)}`;
}

export function MeilensteinPlaner({
  projektId,
  meilensteine,
}: {
  projektId: string;
  meilensteine: Meilenstein[];
}) {
  const queryClient = useQueryClient();
  const [titel, setTitel] = useState("");
  const [frist, setFrist] = useState("");

  const neuLaden = () => queryClient.invalidateQueries({ queryKey: ["meilensteine"] });
  const cacheAktualisieren = (aktualisieren: (alt: Meilenstein[]) => Meilenstein[]) => {
    queryClient.setQueryData<Meilenstein[]>(["meilensteine"], (alt = []) => aktualisieren(alt));
  };

  const anlegen = useMutation({
    mutationFn: () =>
      meilensteinAnlegen({ projekt_id: projektId, titel: titel.trim(), frist: frist || null }),
    onSuccess: async (neu) => {
      cacheAktualisieren((alt) => [...alt, neu]);
      setTitel("");
      setFrist("");
      await neuLaden();
      toast.success("Milestone gespeichert");
    },
    onError: (e: Error) => toast.error(`Milestone konnte nicht gespeichert werden: ${e.message}`),
  });

  const umschalten = useMutation({
    mutationFn: (m: Meilenstein) => meilensteinAktualisieren(m.id, { erledigt: !m.erledigt }),
    onSuccess: async (aktualisiert) => {
      cacheAktualisieren((alt) => alt.map((m) => (m.id === aktualisiert.id ? aktualisiert : m)));
      await neuLaden();
    },
    onError: (e: Error) => toast.error(`Änderung fehlgeschlagen: ${e.message}`),
  });

  const loeschen = useMutation({
    mutationFn: (id: string) => meilensteinLoeschen(id),
    onSuccess: async (geloeschteId) => {
      cacheAktualisieren((alt) => alt.filter((m) => m.id !== geloeschteId));
      await neuLaden();
    },
    onError: (e: Error) => toast.error(`Löschen fehlgeschlagen: ${e.message}`),
  });

  const offen = meilensteine.filter((m) => !m.erledigt).length;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">Planer · eigene Milestones</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {offen} offen · {meilensteine.length} gesamt
        </span>
      </div>

      {meilensteine.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Noch keine Milestones. Lege unten die erste Zwischenfrist an.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {meilensteine.map((m) => {
            const ampel = m.erledigt ? "keine" : fristAmpel(m.frist);
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => umschalten.mutate(m)}
                  aria-label={m.erledigt ? "Als offen markieren" : "Als erledigt markieren"}
                  className={`grid size-5 shrink-0 place-items-center rounded border ${
                    m.erledigt ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {m.erledigt ? <Check className="size-3.5" aria-hidden /> : null}
                </button>
                <span
                  className={`min-w-0 flex-1 text-sm ${m.erledigt ? "text-muted-foreground line-through" : ""}`}
                >
                  {m.titel}
                  {m.notiz ? (
                    <span className="block text-xs text-muted-foreground">{m.notiz}</span>
                  ) : null}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AMPEL_KLASSEN[ampel]}`}>
                  {m.erledigt ? "erledigt" : datumText(m.frist)}
                </span>
                <button
                  type="button"
                  onClick={() => loeschen.mutate(m.id)}
                  aria-label="Milestone löschen"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!titel.trim()) {
            toast.error("Bitte einen Titel für den Milestone angeben");
            return;
          }
          anlegen.mutate();
        }}
      >
        <label className="min-w-[12rem] flex-1 text-xs text-muted-foreground">
          Milestone
          <Input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="z. B. Zwischenbericht abstimmen"
            className="mt-1"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Frist
          <Input
            type="date"
            value={frist}
            onChange={(e) => setFrist(e.target.value)}
            className="mt-1"
          />
        </label>
        <Button type="submit" size="sm" disabled={anlegen.isPending}>
          <Plus className="size-4" aria-hidden /> Hinzufügen
        </Button>
      </form>
    </div>
  );
}
