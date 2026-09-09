import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import {
  dokumentHochladen,
  dokumentLinkHolen,
  dokumentLoeschen,
  dokumenteQueryOptions,
  groesseText,
  type Dokument,
} from "@/lib/dokumente";

export function DokumentListe({ projektId }: { projektId: string }) {
  const queryClient = useQueryClient();
  const dateiFeld = useRef<HTMLInputElement>(null);
  const { data: dokumente = [], isLoading } = useQuery(dokumenteQueryOptions(projektId));

  const aktualisieren = () =>
    queryClient.invalidateQueries({ queryKey: ["dokumente", projektId] });

  const hochladen = useMutation({
    mutationFn: (datei: File) => dokumentHochladen(projektId, datei),
    onSuccess: () => {
      toast.success("Datei hochgeladen");
      void aktualisieren();
    },
    onError: (fehler: Error) => toast.error(`Upload fehlgeschlagen: ${fehler.message}`),
  });

  const loeschen = useMutation({
    mutationFn: (dokument: Dokument) => dokumentLoeschen(dokument),
    onSuccess: () => {
      toast.success("Datei entfernt");
      void aktualisieren();
    },
    onError: (fehler: Error) => toast.error(`Löschen fehlgeschlagen: ${fehler.message}`),
  });

  async function oeffnen(dokument: Dokument) {
    try {
      const url = await dokumentLinkHolen(dokument.pfad);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (fehler) {
      toast.error(`Datei konnte nicht geöffnet werden: ${(fehler as Error).message}`);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Paperclip className="size-4 text-muted-foreground" aria-hidden />
          Dokumente
        </h4>
        <button
          type="button"
          onClick={() => dateiFeld.current?.click()}
          disabled={hochladen.isPending}
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {hochladen.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          Datei hochladen
        </button>
        <input
          ref={dateiFeld}
          type="file"
          className="hidden"
          onChange={(e) => {
            const datei = e.target.files?.[0];
            if (datei) hochladen.mutate(datei);
            e.target.value = "";
          }}
        />
      </div>

      {isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Lädt…</p>
      ) : dokumente.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Noch keine Dateien. Max. 20 MB pro Datei.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {dokumente.map((dokument) => (
            <li
              key={dokument.id}
              className="flex items-center justify-between gap-2 rounded-md bg-surface px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => void oeffnen(dokument)}
                className="flex min-w-0 items-center gap-1.5 text-left text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{dokument.dateiname}</span>
              </button>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {groesseText(dokument.groesse)}
                </span>
                <button
                  type="button"
                  onClick={() => loeschen.mutate(dokument)}
                  title="Datei löschen"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
