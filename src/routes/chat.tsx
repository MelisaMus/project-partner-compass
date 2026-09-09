import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";

import { ChatPanel } from "@/components/ChatPanel";
import { Reiter } from "@/components/Reiter";

type ChatSuche = { frage?: string | undefined };

export const Route = createFileRoute("/chat")({
  validateSearch: (suche: Record<string, unknown>): ChatSuche => ({
    frage: typeof suche['frage'] === "string" ? (suche['frage'] as string).slice(0, 500) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chat zum Projektstand – Project Partner Compass" },
      {
        name: "description",
        content:
          "Fragen zum aktuellen Stand der Teilprojekte, Fristen und Partnerorganisationen im Gespräch beantworten lassen.",
      },
      { property: "og:title", content: "Chat zum Projektstand – Project Partner Compass" },
      {
        property: "og:description",
        content: "Statusabfrage im Gespräch: Fristen, Partner und Berichtspflichten auf einen Blick.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatSeite,
});

function ChatSeite() {
  const { frage } = Route.useSearch();

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Compass className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Chat zum Projektstand</h1>
              <p className="text-sm text-muted-foreground">
                Fragen zu Fristen, Partnern und Status – das Gespräch bleibt beim Wechsel erhalten
              </p>
            </div>
          </div>
          <Reiter />
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-4 px-6 py-6">
        <ChatPanel startFrage={frage} />
        <p className="text-xs text-muted-foreground">
          Alle Beispielkarten sind fiktiv. Antworten beruhen auf den aktuellen Karten des Boards.
        </p>
      </div>
    </main>
  );
}
