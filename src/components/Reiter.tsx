import { Link } from "@tanstack/react-router";

const REITER = [
  { to: "/", label: "Board" },
  { to: "/uebersicht", label: "Übersicht" },
  { to: "/boards", label: "Boards" },
  { to: "/partner", label: "Partner" },
  { to: "/termine", label: "Termine" },
  { to: "/chat", label: "Chat" },
  { to: "/fristen", label: "Fristen" },
  { to: "/wochenbericht", label: "Wochenbericht" },
  { to: "/export", label: "Export" },

] as const;

/** Reiter-Navigation zwischen Board, Übersicht und Chat. */
export function Reiter() {
  return (
    <nav aria-label="Bereiche" className="flex gap-1 rounded-lg border border-border bg-surface p-1">
      {REITER.map((reiter) => (
        <Link
          key={reiter.to}
          to={reiter.to}
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-card text-foreground shadow-card" }}
          inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {reiter.label}
        </Link>
      ))}
    </nav>
  );
}
