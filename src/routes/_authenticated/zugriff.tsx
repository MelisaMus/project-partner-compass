import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Reiter } from "@/components/Reiter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { datumText } from "@/lib/darstellung";
import { ROLLE_TEXT, meineRolleQueryOptions, type Rolle } from "@/lib/rollen";
import {
  rolleSetzen,
  zugaengeListe,
  zugangAnlegen,
  zugangEntfernen,
  type Zugang,
} from "@/lib/zugriff.functions";

export const Route = createFileRoute("/_authenticated/zugriff")({
  head: () => ({
    meta: [
      { title: "Zugriff verwalten – Project Partner Compass" },
      {
        name: "description",
        content:
          "Zugänge und Rollen für die Projektkoordination verwalten: Verwaltung darf bearbeiten, Lesen darf nur ansehen.",
      },
      { property: "og:title", content: "Zugriff verwalten – Project Partner Compass" },
      { property: "og:description", content: "Zugänge und Rollen der Projektkoordination." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ZugriffSeite,
});

function ZugriffSeite() {
  const queryClient = useQueryClient();
  const { data: meineRolle } = useQuery(meineRolleQueryOptions);
  const listeLaden = useServerFn(zugaengeListe);
  const anlegenFn = useServerFn(zugangAnlegen);
  const rolleFn = useServerFn(rolleSetzen);
  const entfernenFn = useServerFn(zugangEntfernen);

  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [rolle, setRolle] = useState<Rolle>("lesen");

  const darfVerwalten = meineRolle === "verwaltung";

  const {
    data: zugaenge = [],
    isLoading,
    error,
  } = useQuery<Zugang[]>({
    queryKey: ["zugaenge"],
    queryFn: () => listeLaden(),
    enabled: darfVerwalten,
  });

  const neuLaden = () => queryClient.invalidateQueries({ queryKey: ["zugaenge"] });

  const anlegen = useMutation({
    mutationFn: () => anlegenFn({ data: { email, passwort, rolle } }),
    onSuccess: () => {
      toast.success("Zugang angelegt");
      setEmail("");
      setPasswort("");
      setRolle("lesen");
      void neuLaden();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rolleAendern = useMutation({
    mutationFn: (werte: { userId: string; rolle: Rolle }) => rolleFn({ data: werte }),
    onSuccess: () => {
      toast.success("Rolle geändert");
      void neuLaden();
      void queryClient.invalidateQueries({ queryKey: meineRolleQueryOptions.queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const entfernen = useMutation({
    mutationFn: (userId: string) => entfernenFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Zugang entfernt");
      void neuLaden();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card px-6 py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Zugriff</h1>
            <p className="mt-1 text-muted-foreground">
              Zugänge anlegen und Rollen festlegen: Verwaltung darf bearbeiten, Lesen darf nur
              ansehen.
            </p>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {!darfVerwalten ? (
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Deine Rolle ist „{ROLLE_TEXT.lesen}“. Zugänge verwalten darf nur die Verwaltung.
          </p>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold">Neuen Zugang anlegen</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Die Person kann sich sofort mit E-Mail und diesem Passwort anmelden und es später
                über „Passwort vergessen“ ändern.
              </p>
              <form
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                onSubmit={(e) => {
                  e.preventDefault();
                  anlegen.mutate();
                }}
              >
                <Input
                  type="email"
                  required
                  placeholder="E-Mail-Adresse"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="E-Mail-Adresse"
                />
                <Input
                  type="text"
                  required
                  minLength={10}
                  placeholder="Startpasswort (min. 10 Zeichen)"
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  aria-label="Startpasswort"
                />
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={rolle}
                  onChange={(e) => setRolle(e.target.value as Rolle)}
                  aria-label="Rolle"
                >
                  <option value="lesen">Lesen</option>
                  <option value="verwaltung">Verwaltung</option>
                </select>
                <Button type="submit" disabled={anlegen.isPending}>
                  Anlegen
                </Button>
              </form>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-bold">Bestehende Zugänge</h2>
              {isLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Zugänge werden geladen…</p>
              ) : error ? (
                <p className="mt-3 text-sm text-ampel-rot-foreground">{(error as Error).message}</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {zugaenge.map((zugang) => (
                    <li
                      key={zugang.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{zugang.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Angelegt am {datumText(zugang.angelegt)} · Letzte Anmeldung{" "}
                          {datumText(zugang.letzte_anmeldung)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          value={zugang.rolle}
                          onChange={(e) =>
                            rolleAendern.mutate({
                              userId: zugang.id,
                              rolle: e.target.value as Rolle,
                            })
                          }
                          aria-label={`Rolle von ${zugang.email}`}
                        >
                          <option value="lesen">Lesen</option>
                          <option value="verwaltung">Verwaltung</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Zugang ${zugang.email} wirklich entfernen?`)) {
                              entfernen.mutate(zugang.id);
                            }
                          }}
                        >
                          Entfernen
                        </Button>
                      </div>
                    </li>
                  ))}
                  {zugaenge.length === 0 ? (
                    <li className="py-3 text-sm text-muted-foreground">Keine Zugänge gefunden.</li>
                  ) : null}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
