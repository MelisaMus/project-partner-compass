import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Compass,
  FileText,
  LayoutGrid,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * Bereiche der App. Der erste Eintrag je Bereich ist die Startseite,
 * alle Pfade eines Bereichs markieren ihn als aktiv.
 */
export type Bereich = {
  label: string;
  icon: LucideIcon;
  seiten: readonly { to: string; label: string }[];
};

export const BEREICHE: readonly Bereich[] = [
  {
    label: "Board",
    icon: LayoutGrid,
    seiten: [
      { to: "/", label: "Haupt-Board" },
      { to: "/boards", label: "Weitere Boards" },
    ],
  },
  {
    label: "Übersicht",
    icon: Compass,
    seiten: [
      { to: "/uebersicht", label: "Projekte" },
      { to: "/partner", label: "Partner" },
    ],
  },
  {
    label: "Termine & Fristen",
    icon: CalendarDays,
    seiten: [
      { to: "/termine", label: "Termine" },
      { to: "/fristen", label: "Frist-Alarm" },
    ],
  },
  { label: "Chat", icon: MessageSquare, seiten: [{ to: "/chat", label: "Chat" }] },
  {
    label: "Berichte",
    icon: FileText,
    seiten: [
      { to: "/wochenbericht", label: "Wochenbericht" },
      { to: "/export", label: "PDF-Export" },
    ],
  },
] as const;

export function aktiverBereich(pfad: string): Bereich | undefined {
  return BEREICHE.find((bereich) => bereich.seiten.some((seite) => seite.to === pfad));
}

/** Dashboard-Rahmen: dunkle Seitenleiste links, Seiteninhalt rechts. */
export function AppShell({ children }: { children: ReactNode }) {
  const pfad = useRouterState({ select: (zustand) => zustand.location.pathname });
  const aktiv = aktiverBereich(pfad);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy text-navy-foreground lg:flex">
        <div className="flex items-center gap-3 px-6 py-7">
          <span className="grid size-10 place-items-center rounded-xl bg-teal text-teal-foreground">
            <Compass className="size-5" aria-hidden />
          </span>
          <p className="font-display text-lg font-bold leading-tight">
            Project Partner
            <br />
            <span className="text-teal">Compass</span>
          </p>
        </div>

        <nav aria-label="Bereiche" className="mt-4 flex-1 space-y-1 px-3">
          {BEREICHE.map((bereich) => {
            const istAktiv = bereich === aktiv;
            const Icon = bereich.icon;
            return (
              <Link
                key={bereich.label}
                to={bereich.seiten[0]!.to}
                aria-current={istAktiv ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  istAktiv
                    ? "bg-navy-hover font-medium text-navy-foreground"
                    : "text-navy-muted hover:bg-navy-hover/50 hover:text-navy-foreground"
                }`}
              >
                <Icon className="size-5 opacity-80" aria-hidden />
                {bereich.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-5">
          <div className="rounded-2xl bg-navy-hover/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal">Hinweis</p>
            <p className="mt-2 text-sm leading-relaxed text-navy-foreground/80">
              Alle mit „Beispielprojekt“ gekennzeichneten Karten sind fiktive Testdaten.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav
          aria-label="Bereiche (kompakt)"
          className="flex gap-1 overflow-x-auto bg-navy px-3 py-2 lg:hidden"
        >
          {BEREICHE.map((bereich) => {
            const istAktiv = bereich === aktiv;
            return (
              <Link
                key={bereich.label}
                to={bereich.seiten[0]!.to}
                aria-current={istAktiv ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  istAktiv
                    ? "bg-navy-hover font-medium text-navy-foreground"
                    : "text-navy-muted hover:text-navy-foreground"
                }`}
              >
                {bereich.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}
