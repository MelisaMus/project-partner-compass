import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Anmelden – Project Partner Compass" },
      {
        name: "description",
        content:
          "Anmeldung für die Projektkoordination: Board, Termine und Berichte sind nur für eingeladene Personen zugänglich.",
      },
      { property: "og:title", content: "Anmelden – Project Partner Compass" },
      {
        property: "og:description",
        content: "Zugang zur Koordination von Teilprojekten mit Partnerorganisationen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnmeldeSeite,
});

function AnmeldeSeite() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [modus, setModus] = useState<"anmelden" | "vergessen">("anmelden");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function anmelden(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    setLaeuft(true);
    try {
      if (modus === "vergessen") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/passwort-neu`,
        });
        if (error) throw error;
        toast.success("E-Mail zum Zurücksetzen ist unterwegs.");
        setModus("anmelden");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: passwort,
      });
      if (error) throw error;
      navigate({ to: "/", replace: true });
    } catch (fehler) {
      toast.error(
        fehler instanceof Error ? fehler.message : "Anmeldung nicht möglich. Bitte erneut versuchen.",
      );
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-teal text-teal-foreground">
            <Compass className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">Project Partner Compass</h1>
            <p className="text-sm text-muted-foreground">
              Koordination von Teilprojekten mit internen und externen Partnerorganisationen
            </p>
          </div>
        </div>

        <form onSubmit={anmelden} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@einrichtung.de"
            />
          </div>

          {modus === "anmelden" ? (
            <div className="space-y-1.5">
              <label htmlFor="passwort" className="text-sm font-medium">
                Passwort
              </label>
              <Input
                id="passwort"
                type="password"
                autoComplete="current-password"
                required
                value={passwort}
                onChange={(e) => setPasswort(e.target.value)}
              />
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={laeuft}>
            {modus === "anmelden" ? "Anmelden" : "Link zum Zurücksetzen senden"}
          </Button>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setModus(modus === "anmelden" ? "vergessen" : "anmelden")}
          >
            {modus === "anmelden" ? "Passwort vergessen?" : "Zurück zur Anmeldung"}
          </button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Der Zugang ist auf eingeladene Personen beschränkt. Eine eigene Registrierung ist nicht
          möglich – neue Zugänge werden im Backend angelegt.
        </p>
      </div>
    </main>
  );
}
