import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/passwort-neu")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Neues Passwort – Project Partner Compass" },
      {
        name: "description",
        content: "Neues Passwort für den Zugang zur Projektkoordination festlegen.",
      },
      { property: "og:title", content: "Neues Passwort – Project Partner Compass" },
      { property: "og:description", content: "Passwort für den Zugang neu setzen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PasswortNeu,
});

function PasswortNeu() {
  const navigate = useNavigate();
  const [passwort, setPasswort] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  async function speichern(ereignis: React.FormEvent) {
    ereignis.preventDefault();
    setLaeuft(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwort });
      if (error) throw error;
      toast.success("Passwort gespeichert.");
      navigate({ to: "/", replace: true });
    } catch (fehler) {
      toast.error(fehler instanceof Error ? fehler.message : "Passwort konnte nicht gesetzt werden.");
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-xl">
        <h1 className="font-display text-xl font-bold">Neues Passwort festlegen</h1>
        <form onSubmit={speichern} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="neu" className="text-sm font-medium">
              Neues Passwort
            </label>
            <Input
              id="neu"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={laeuft}>
            Passwort speichern
          </Button>
        </form>
      </div>
    </main>
  );
}
