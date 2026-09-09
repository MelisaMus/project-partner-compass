import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alte Adresse: Die Partneransicht ist jetzt Teil der Übersicht (Gruppierung „Partner“). */
export const Route = createFileRoute("/partner")({
  beforeLoad: () => {
    throw redirect({ to: "/uebersicht", replace: true });
  },
});
