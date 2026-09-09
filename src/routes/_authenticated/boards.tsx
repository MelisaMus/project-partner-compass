import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Reiter } from "@/components/Reiter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OHNE_BOARD, boardAnlegen, boardLoeschen, boardsQueryOptions } from "@/lib/boards";
import { fristAmpel, fristLabel } from "@/lib/fristen";
import { projektAktualisieren, projekteQueryOptions, type Projekt } from "@/lib/projekte";
import { AMPEL_KLASSEN } from "@/lib/darstellung";

export const Route = createFileRoute("/_authenticated/boards")({
  head: () => ({
    meta: [
      { title: "Boards & Projektkategorien – Project Partner Compass" },
      {
        name: "description",
        content:
          "Teilprojekte in mehrere Boards bzw. Projektkategorien einordnen – neben dem Haupt-Board.",
      },
      { property: "og:title", content: "Boards & Projektkategorien – Project Partner Compass" },
      {
        property: "og:description",
        content: "Eigene Boards anlegen und Projekte einer Kategorie zuordnen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/boards" }],
  }),
  component: BoardsSeite,
});


function BoardsSeite() {
  const queryClient = useQueryClient();
  const { data: boards, error: boardsFehler } = useQuery(boardsQueryOptions);
  const { data: projekte, isLoading, error } = useQuery(projekteQueryOptions);
  const [neuerName, setNeuerName] = useState("");
  const [neueBeschreibung, setNeueBeschreibung] = useState("");

  const boardsAktualisieren = () => {
    queryClient.invalidateQueries({ queryKey: ["boards"] });
    queryClient.invalidateQueries({ queryKey: ["projekte"] });
  };

  const anlegen = useMutation({
    mutationFn: () => boardAnlegen(neuerName.trim(), neueBeschreibung.trim() || null),
    onSuccess: () => {
      setNeuerName("");
      setNeueBeschreibung("");
      boardsAktualisieren();
      toast.success("Board angelegt");
    },
    onError: (fehler: Error) => toast.error(fehler.message),
  });

  const loeschen = useMutation({
    mutationFn: (id: string) => boardLoeschen(id),
    onSuccess: () => {
      boardsAktualisieren();
      toast.success("Board gelöscht – die Projekte bleiben erhalten");
    },
    onError: (fehler: Error) => toast.error(fehler.message),
  });

  const zuordnen = useMutation({
    mutationFn: ({ id, boardId }: { id: string; boardId: string | null }) =>
      projektAktualisieren(id, { board_id: boardId }),
    onSuccess: boardsAktualisieren,
    onError: (fehler: Error) => toast.error(fehler.message),
  });

  const gruppen: { id: string | null; name: string; beschreibung: string | null; projekte: Projekt[] }[] =
    [
      ...(boards ?? []).map((board) => ({
        id: board.id,
        name: board.name,
        beschreibung: board.beschreibung,
        projekte: (projekte ?? []).filter((p) => p.board_id === board.id),
      })),
      {
        id: null,
        name: "Noch keinem Board zugeordnet",
        beschreibung: null,
        projekte: (projekte ?? []).filter((p) => !p.board_id),
      },
    ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <LayoutGrid className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Boards &amp; Projektkategorien</h1>
              <p className="text-sm text-muted-foreground">
                Projekte in eigene Boards einordnen – neben dem Haupt-Board
              </p>
            </div>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {error || boardsFehler ? (
          <p className="rounded-lg bg-ampel-rot px-4 py-3 text-sm text-ampel-rot-foreground">
            Konnte nicht geladen werden: {((error ?? boardsFehler) as Error).message}
          </p>
        ) : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Lädt…</p> : null}

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-semibold">Neues Board anlegen</h2>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (neuerName.trim() && !anlegen.isPending) anlegen.mutate();
            }}
          >
            <Input
              className="w-full sm:w-64"
              value={neuerName}
              onChange={(e) => setNeuerName(e.target.value)}
              placeholder="Name, z. B. Forschungskooperationen"
              aria-label="Name des Boards"
            />
            <Input
              className="w-full sm:w-72"
              value={neueBeschreibung}
              onChange={(e) => setNeueBeschreibung(e.target.value)}
              placeholder="Kurzbeschreibung (optional)"
              aria-label="Beschreibung des Boards"
            />
            <Button type="submit" disabled={anlegen.isPending || !neuerName.trim()}>
              Board anlegen
            </Button>
          </form>
        </section>

        {gruppen.map((gruppe) => (
          <section
            key={gruppe.id ?? "ohne"}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{gruppe.name}</h2>
                {gruppe.beschreibung ? (
                  <p className="text-sm text-muted-foreground">{gruppe.beschreibung}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                  {gruppe.projekte.length} {gruppe.projekte.length === 1 ? "Projekt" : "Projekte"}
                </span>
                {gruppe.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => loeschen.mutate(gruppe.id as string)}
                    aria-label={`Board ${gruppe.name} löschen`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>

            {gruppe.projekte.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Noch keine Projekte in diesem Board.
              </p>
            ) : (
              <ul className="mt-4 space-y-1">
                {gruppe.projekte.map((projekt) => (
                  <li
                    key={projekt.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface"
                  >
                    <span className="font-medium">{projekt.titel}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                        {projekt.status}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${AMPEL_KLASSEN[fristAmpel(projekt.naechste_frist)]}`}
                      >
                        {fristLabel(projekt.naechste_frist)}
                      </span>
                      <Select
                        value={projekt.board_id ?? OHNE_BOARD}
                        onValueChange={(wert) =>
                          zuordnen.mutate({
                            id: projekt.id,
                            boardId: wert === OHNE_BOARD ? null : wert,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-48 text-xs" aria-label="Board zuordnen">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OHNE_BOARD}>Ohne Board</SelectItem>
                          {(boards ?? []).map((board) => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          Die vorhandenen Boards und Projekte mit „Beispiel“ im Namen sind fiktive Testdaten. Ein
          gelöschtes Board entfernt keine Projekte – sie erscheinen dann wieder ohne Zuordnung.
        </p>
      </div>
    </main>
  );
}
