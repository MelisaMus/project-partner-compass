import { Link, useRouterState } from "@tanstack/react-router";

type Ziel = { to: string; label: string };

type Bereich = {
  label: string;
  /** Erster Eintrag ist die Startseite des Bereichs. */
  seiten: readonly Ziel[];
};

/**
 * Fünf Bereiche statt neun gleichrangiger Reiter: inhaltlich verwandte Seiten
 * (Übersicht/Partner, Termine/Fristen, Wochenbericht/Export) liegen zusammen und
 * erscheinen als Unterreiter, sobald der Bereich geöffnet ist.
 */
const BEREICHE: readonly Bereich[] = [
  {
    label: "Board",
    seiten: [
      { to: "/", label: "Haupt-Board" },
      { to: "/boards", label: "Weitere Boards" },
    ],
  },
  {
    label: "Übersicht",
    seiten: [
      { to: "/uebersicht", label: "Projekte" },
      { to: "/partner", label: "Partner" },
    ],
  },
  {
    label: "Termine & Fristen",
    seiten: [
      { to: "/termine", label: "Termine" },
      { to: "/fristen", label: "Frist-Alarm" },
    ],
  },
  { label: "Chat", seiten: [{ to: "/chat", label: "Chat" }] },
  {
    label: "Berichte",
    seiten: [
      { to: "/wochenbericht", label: "Wochenbericht" },
      { to: "/export", label: "PDF-Export" },
    ],
  },
] as const;

const REITER_KLASSEN = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
const AKTIV = { className: "bg-card text-foreground shadow-card" };
const INAKTIV = { className: "text-muted-foreground hover:text-foreground" };

function istImBereich(bereich: Bereich, pfad: string): boolean {
  return bereich.seiten.some((seite) => seite.to === pfad);
}

/** Bereichs-Navigation mit Unterreitern für den geöffneten Bereich. */
export function Reiter() {
  const pfad = useRouterState({ select: (zustand) => zustand.location.pathname });
  const aktiverBereich = BEREICHE.find((bereich) => istImBereich(bereich, pfad));
  const unterseiten = aktiverBereich && aktiverBereich.seiten.length > 1 ? aktiverBereich.seiten : [];

  return (
    <div className="flex flex-col gap-2">
      <nav
        aria-label="Bereiche"
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {BEREICHE.map((bereich) => {
          const aktiv = bereich === aktiverBereich;
          return (
            <Link
              key={bereich.label}
              to={bereich.seiten[0]!.to}
              aria-current={aktiv ? "page" : undefined}
              className={`${REITER_KLASSEN} ${aktiv ? AKTIV.className : INAKTIV.className}`}
            >
              {bereich.label}
            </Link>
          );
        })}
      </nav>

      {unterseiten.length > 0 ? (
        <nav
          aria-label={`${aktiverBereich!.label}: Unterbereiche`}
          className="flex flex-wrap gap-1 px-1"
        >
          {unterseiten.map((seite) => (
            <Link
              key={seite.to}
              to={seite.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "border-primary text-foreground" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground hover:text-foreground" }}
              className="border-b-2 px-2 pb-1 text-sm font-medium transition-colors"
            >
              {seite.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
