import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  kontaktAnlegen,
  kontaktLoeschen,
  kontakteFuerPartner,
  kontakteQueryOptions,
  telefonLink,
} from "@/lib/kontakte";

export function KontaktListe({ partnerorganisation }: { partnerorganisation: string | null }) {
  const queryClient = useQueryClient();
  const { data: alle = [] } = useQuery(kontakteQueryOptions);
  const partner = (partnerorganisation ?? "").trim();
  const kontakte = kontakteFuerPartner(alle, partner);

  const [name, setName] = useState("");
  const [rolle, setRolle] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");

  const aktualisieren = () => queryClient.invalidateQueries({ queryKey: ["kontakte"] });

  const anlegen = useMutation({
    mutationFn: () =>
      kontaktAnlegen({
        partnerorganisation: partner,
        name: name.trim(),
        rolle: rolle.trim() || null,
        email: email.trim() || null,
        telefon: telefon.trim() || null,
      }),
    onSuccess: () => {
      setName("");
      setRolle("");
      setEmail("");
      setTelefon("");
      toast.success("Kontakt gespeichert");
      void aktualisieren();
    },
    onError: (fehler: Error) => toast.error(`Speichern fehlgeschlagen: ${fehler.message}`),
  });

  const loeschen = useMutation({
    mutationFn: (id: string) => kontaktLoeschen(id),
    onSuccess: () => {
      toast.success("Kontakt entfernt");
      void aktualisieren();
    },
    onError: (fehler: Error) => toast.error(`Löschen fehlgeschlagen: ${fehler.message}`),
  });

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold">
        <Users className="size-4 text-muted-foreground" aria-hidden />
        Kontaktdaten {partner ? `– ${partner}` : ""}
      </h4>

      {!partner ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Zuerst eine Partnerorganisation eintragen, dann können Kontakte hinterlegt werden.
        </p>
      ) : (
        <>
          {kontakte.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">Noch keine Kontakte hinterlegt.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {kontakte.map((kontakt) => (
                <li
                  key={kontakt.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-2 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{kontakt.name}</span>
                    {kontakt.rolle ? (
                      <span className="block text-[11px] text-muted-foreground">{kontakt.rolle}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {kontakt.email ? (
                      <a
                        href={`mailto:${kontakt.email}`}
                        title={`E-Mail an ${kontakt.email}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Mail className="size-3.5" aria-hidden />
                        E-Mail
                      </a>
                    ) : null}
                    {kontakt.telefon ? (
                      <a
                        href={telefonLink(kontakt.telefon)}
                        title={`Anrufen: ${kontakt.telefon}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        {kontakt.telefon}
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => loeschen.mutate(kontakt.id)}
                      title="Kontakt löschen"
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              aria-label="Name des Kontakts"
            />
            <Input
              value={rolle}
              onChange={(e) => setRolle(e.target.value)}
              placeholder="Rolle (optional)"
              aria-label="Rolle"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail"
              aria-label="E-Mail"
            />
            <Input
              type="tel"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="Telefon"
              aria-label="Telefon"
            />
          </div>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => anlegen.mutate()}
            disabled={anlegen.isPending || !name.trim()}
          >
            {anlegen.isPending ? "Speichern…" : "Kontakt hinzufügen"}
          </Button>
        </>
      )}
    </div>
  );
}
