import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";

import { ProjektExport } from "@/components/ProjektExport";
import { WochenberichtVorschau } from "@/components/WochenberichtVorschau";

export const Route = createFileRoute("/berichte")({
  head: () => ({
    meta: [
      { title: "Berichte und Export – Project Partner Compass" },
      {
        name: "description",
        content:
          "Wochenbericht-Vorschau und PDF-Export einzelner Projekte mit Meilensteinen, Dokumenten und Partnerkontakten auf einer Seite.",
      },
      { property: "og:title", content: "Berichte und Export – Project Partner Compass" },
      {
        property: "og:description",
        content: "Montagsbericht vorab ansehen und Partnerberichte als PDF ausgeben.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/berichte" }],
  }),
  component: BerichteSeite,
});

const ANSICHTEN = [
  { schluessel: "woche", label: "Wochenbericht" },
  { schluessel: "export", label: "Projektbericht als PDF" },
] as const;

type Ansicht = (typeof ANSICHTEN)[number]["schluessel"];

function BerichteSeite() {
  const [ansicht, setAnsicht] = useState<Ansicht>("woche");

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="size-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">Berichte</h1>
              <p className="text-sm text-muted-foreground">
                Wochenbericht vorab ansehen und einzelne Projektberichte als PDF ausgeben
              </p>
            </div>
          </div>
          <div
            className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1"
            role="group"
            aria-label="Berichtsart wählen"
          >
            {ANSICHTEN.map((option) => (
              <button
                key={option.schluessel}
                type="button"
                onClick={() => setAnsicht(option.schluessel)}
                aria-pressed={ansicht === option.schluessel}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  ansicht === option.schluessel
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {ansicht === "woche" ? <WochenberichtVorschau /> : <ProjektExport />}
      </div>
    </main>
  );
}
