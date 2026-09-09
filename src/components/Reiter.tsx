import { Link, useRouterState } from "@tanstack/react-router";

import { aktiverBereich } from "@/components/AppShell";

/**
 * Unterreiter des aktuellen Bereichs. Die Bereichsnavigation selbst liegt in
 * der Seitenleiste (AppShell); hier erscheinen nur die Seiten des Bereichs.
 */
export function Reiter() {
  const pfad = useRouterState({ select: (zustand) => zustand.location.pathname });
  const bereich = aktiverBereich(pfad);
  if (!bereich || bereich.seiten.length < 2) return null;

  return (
    <nav
      aria-label={`${bereich.label}: Unterbereiche`}
      className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1"
    >
      {bereich.seiten.map((seite) => (
        <Link
          key={seite.to}
          to={seite.to}
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-card text-foreground shadow-card" }}
          inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {seite.label}
        </Link>
      ))}
    </nav>
  );
}
